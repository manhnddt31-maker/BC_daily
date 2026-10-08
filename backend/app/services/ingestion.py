"""Tải dữ liệu một nguồn, kiểm định và công bố snapshot trong một transaction."""

from dataclasses import asdict
from datetime import UTC, date, datetime, timedelta
from hashlib import sha256
import json
import logging
import time

from sqlalchemy import select, func, text

from ..models import Base, BulletinSnapshot, DailyPrice, Equity, IngestionRun, Sector
from ..universe.importer import UniverseRecord
from .snapshot_builder import build_snapshot


logger = logging.getLogger(__name__)
# Một khóa chung cho worker/CLI nhằm ngăn hai lần ingest cùng công bố.
INGEST_LOCK = 436_260_923


def _upsert_universe(session, universe):
    checksum = sha256(json.dumps([asdict(row) for row in universe], sort_keys=True).encode()).hexdigest()
    sector_ids = {row.name: row.id for row in session.scalars(select(Sector))}
    equity_ids = {}
    for row in universe:
        if row.sector not in sector_ids:
            sector = Sector(name=row.sector)
            session.add(sector)
            session.flush()
            sector_ids[row.sector] = sector.id
        equity = session.scalar(select(Equity).where(Equity.symbol == row.symbol))
        if equity is None:
            equity = Equity(symbol=row.symbol)
            session.add(equity)
        equity.company_name = row.company_name
        equity.exchange = row.exchange
        equity.display_order = row.order
        equity.sector_id = sector_ids[row.sector]
        equity.active = True
        equity.universe_checksum = checksum
        session.flush()
        equity_ids[row.symbol] = equity.id
    return equity_ids


def _save_prices(session, equity_id, bars):
    existing = {row.trading_date: row for row in session.scalars(
        select(DailyPrice).where(DailyPrice.equity_id == equity_id)
    )}
    for bar in bars:
        row = existing.get(bar.trading_date)
        if row is None:
            row = DailyPrice(equity_id=equity_id, trading_date=bar.trading_date)
            session.add(row)
        for field in ('open', 'high', 'low', 'close', 'volume'):
            setattr(row, field, getattr(bar, field))
        row.source = 'VCI'
        row.checksum = sha256(json.dumps(asdict(bar), default=str, sort_keys=True).encode()).hexdigest()


def ingest(factory, provider, universe, *, end: date, request_delay=1.1,
           minimum_coverage=0.95, history_days=1500, run_id=None, skip_existing=False):
    """Giữ snapshot trước nếu bất kỳ bước tải, kiểm định hoặc commit bị lỗi."""
    engine = factory.kw['bind']
    lock_connection = engine.connect() if engine.dialect.name == 'postgresql' else None
    if lock_connection is not None:
        acquired = lock_connection.scalar(text('SELECT pg_try_advisory_lock(:key)'), {'key': INGEST_LOCK})
        if not acquired:
            lock_connection.close()
            raise RuntimeError('INGEST_ALREADY_RUNNING')
    try:
        with factory.begin() as session:
            # Khóa đã được lấy; RUNNING còn lại thuộc tiến trình đã ngừng trước đó.
            for abandoned in session.scalars(select(IngestionRun).where(IngestionRun.status == 'RUNNING')):
                abandoned.status = 'FAILED'
                abandoned.error_code = 'WORKER_INTERRUPTED'
                abandoned.finished_at = datetime.now(UTC)
            run = session.get(IngestionRun, run_id) if run_id is not None else None
            if run is None:
                run = IngestionRun(requested_at=datetime.now(UTC), source='VCI')
                session.add(run)
            run.status = 'RUNNING'
            run.started_at = datetime.now(UTC)
            session.flush()
            run_id = run.id
        try:
            start = end - timedelta(days=history_days)
            index_bars = sorted(provider.fetch_vnindex(start=start, end=end), key=lambda bar: bar.trading_date)
            if not index_bars or index_bars[-1].trading_date > end:
                raise ValueError('INVALID_INDEX_SESSION')
            target_date = index_bars[-1].trading_date
            if skip_existing:
                with factory.begin() as session:
                    existing = session.scalar(select(BulletinSnapshot.id).where(BulletinSnapshot.as_of_date == target_date).limit(1))
                    if existing is not None:
                        run = session.get(IngestionRun, run_id)
                        run.status = 'NO_NEW_SESSION'
                        run.target_date = target_date
                        run.finished_at = datetime.now(UTC)
                        return None
            all_bars = {}
            errors = {}
            for count, row in enumerate(universe, 1):
                time.sleep(request_delay)
                try:
                    bars = provider.fetch_equity(row.symbol, start=start, end=end)
                    if not bars or bars[-1].trading_date != target_date:
                        raise ValueError('MISSING_TARGET_SESSION')
                    all_bars[row.symbol] = bars
                except Exception as error:
                    errors[row.symbol] = type(error).__name__
                if count % 20 == 0 or count == len(universe):
                    logger.info('Đã tải %s/%s mã; hợp lệ %s', count, len(universe), len(all_bars))
            coverage = len(all_bars) / len(universe) if universe else 0
            if coverage < minimum_coverage:
                raise ValueError(f'coverage={coverage:.4f} below {minimum_coverage}; excluded={sorted(errors)}')
            created = datetime.now(UTC)
            payload = build_snapshot(universe=universe, equity_bars=all_bars,
                                     vnindex_bars=index_bars, generated_at=created)
            # Chặn NaN/Infinity trước khi ghi PostgreSQL hoặc gửi JSON ra trình duyệt.
            json.dumps(payload, allow_nan=False)
            if errors:
                payload['dataStatus']['warning'] = f'{len(all_bars)}/{len(universe)} mã hợp lệ; loại {len(errors)} mã lỗi dữ liệu nguồn.'
            index_record = UniverseRecord(0, 'Chỉ số', 'VNINDEX', 'VNINDEX', 'INDEX')
            with factory.begin() as session:
                ids = _upsert_universe(session, [*universe, index_record])
                for symbol, bars in {**all_bars, 'VNINDEX': index_bars}.items():
                    _save_prices(session, ids[symbol], bars)
                revision = (session.scalar(select(func.max(BulletinSnapshot.revision)).where(
                    BulletinSnapshot.as_of_date == target_date)) or 0) + 1
                session.add(BulletinSnapshot(as_of_date=target_date, revision=revision,
                    generated_at=created, published_at=created, ingestion_run_id=run_id, payload=payload))
                run = session.get(IngestionRun, run_id)
                run.status = 'SUCCEEDED'
                run.target_date = target_date
                run.finished_at = created
                run.statistics = {'validSymbols': len(all_bars), 'totalSymbols': len(universe),
                                  'coverage': coverage, 'excluded': errors}
            return payload
        except Exception as error:
            with factory.begin() as session:
                run = session.get(IngestionRun, run_id)
                run.status = 'FAILED'
                run.finished_at = datetime.now(UTC)
                run.error_code = type(error).__name__
                # Không ghi chuỗi lỗi provider có thể chứa URL/token.
                run.error_message = 'Không thể công bố dữ liệu mới; giữ snapshot gần nhất.'
            raise
    finally:
        if lock_connection is not None:
            lock_connection.execute(text('SELECT pg_advisory_unlock(:key)'), {'key': INGEST_LOCK})
            lock_connection.close()
