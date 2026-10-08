from datetime import date
from sqlalchemy import create_engine, select, func
from sqlalchemy.orm import sessionmaker
import pytest

from backend.app.models import Base, BulletinSnapshot, DailyPrice, IngestionRun
from backend.app.repositories.snapshots import SnapshotRepository
from backend.app.services.ingestion import ingest
from backend.app.universe.importer import UniverseRecord
from backend.tests.test_snapshot_builder import _bars


class Provider:
    broken = False

    def fetch_vnindex(self, **kwargs):
        return _bars('VNINDEX', 100, 0.05)

    def fetch_equity(self, symbol, **kwargs):
        if self.broken:
            raise ValueError('nguồn lỗi')
        return _bars(symbol, 10, 1)


def test_failed_refresh_preserves_published_snapshot_and_marks_stale():
    # R16–18: thất bại không được ghi đè bản tốt đã công bố.
    engine = create_engine('sqlite://')
    Base.metadata.create_all(engine)
    factory = sessionmaker(engine, expire_on_commit=False)
    universe = [UniverseRecord(1, 'Công nghệ', 'AAA', 'AAA', 'HOSE')]
    provider = Provider()
    ingest(factory, provider, universe, end=date(2026, 7, 24), request_delay=0)
    repository = SnapshotRepository(factory)
    original = repository.latest()
    assert original['strongStocks'][0]['ticker'] == 'AAA'
    with factory() as session:
        assert session.scalar(select(func.count()).select_from(DailyPrice)) == 410
    provider.broken = True

    with pytest.raises(ValueError, match='coverage'):
        ingest(factory, provider, universe, end=date(2026, 7, 24), request_delay=0)

    result = repository.latest()
    assert result['generatedAt'] == original['generatedAt']
    assert result['dataStatus']['stale'] is True
    with factory() as session:
        assert session.scalar(select(func.count()).select_from(BulletinSnapshot)) == 1
        assert session.scalars(select(IngestionRun.status).order_by(IngestionRun.id)).all() == ['SUCCEEDED', 'FAILED']


def test_scheduled_refresh_without_new_session_keeps_same_revision():
    # Ngày nghỉ không tạo snapshot giả mang ngày hiện tại.
    engine = create_engine('sqlite://')
    Base.metadata.create_all(engine)
    factory = sessionmaker(engine, expire_on_commit=False)
    universe = [UniverseRecord(1, 'Công nghệ', 'AAA', 'AAA', 'HOSE')]
    provider = Provider()
    ingest(factory, provider, universe, end=date(2026, 7, 24), request_delay=0)
    ingest(factory, provider, universe, end=date(2026, 7, 25), request_delay=0, skip_existing=True)
    with factory() as session:
        assert session.scalar(select(func.count()).select_from(BulletinSnapshot)) == 1
        assert session.scalars(select(IngestionRun.status).order_by(IngestionRun.id)).all() == ['SUCCEEDED', 'NO_NEW_SESSION']
