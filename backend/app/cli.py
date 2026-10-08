"""Các lệnh khởi tạo và cập nhật dữ liệu local."""

import argparse
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from .config import Settings
from .db import build_engine, build_session_factory
from .models import Base
from .providers.vnstock_provider import VnstockProvider
from .repositories.snapshots import SnapshotRepository
from .services.ingestion import ingest
from .supabase_publisher import publish_snapshot
from .universe.importer import load_universe_records


def publish_to_supabase(settings, payload):
    if settings.supabase_url is None and settings.supabase_secret_key is None:
        return False
    if settings.supabase_url is None or settings.supabase_secret_key is None:
        raise ValueError('INCOMPLETE_SUPABASE_CONFIG')
    publish_snapshot(
        payload,
        base_url=settings.supabase_url,
        secret_key=settings.supabase_secret_key.get_secret_value(),
        timeout=settings.supabase_timeout_seconds,
    )
    return True


def refresh(settings, *, run_id=None, skip_existing=False):
    factory = build_session_factory(build_engine(settings.database_url))
    payload = ingest(factory, VnstockProvider(source=settings.vnstock_source, history_count=settings.history_count,
        max_attempts=settings.source_max_attempts, retry_delay=settings.source_retry_delay),
        load_universe_records(settings.universe_path),
        end=datetime.now(ZoneInfo(settings.app_timezone)).date(),
        request_delay=settings.request_delay, minimum_coverage=settings.minimum_coverage,
        history_days=settings.history_days, run_id=run_id, skip_existing=skip_existing)
    if payload is not None:
        publish_to_supabase(settings, payload)
    return payload


def publish_latest(settings):
    factory = build_session_factory(build_engine(settings.database_url))
    payload = SnapshotRepository(factory).latest()
    if payload is None:
        raise RuntimeError('NO_LOCAL_SNAPSHOT')
    if not publish_to_supabase(settings, payload):
        raise RuntimeError('SUPABASE_NOT_CONFIGURED')
    return payload


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['init-db', 'refresh', 'publish-latest'])
    parser.add_argument('--env-file', default='backend/.env.local')
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')
    settings = Settings(_env_file=args.env_file)
    if args.command == 'init-db':
        Base.metadata.create_all(build_engine(settings.database_url))
        print('Database schema ready')
    else:
        payload = refresh(settings) if args.command == 'refresh' else publish_latest(settings)
        print(f"Published {payload['asOfDate']}: {len(payload['sectors'])} sectors, "
              f"{len(payload['strongStocks'])} strong, {len(payload['potentialStocks'])} potential")


if __name__ == '__main__':
    main()
