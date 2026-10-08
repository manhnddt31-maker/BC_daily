"""Worker local: nhận job thủ công và cập nhật sau giờ đóng cửa."""

import argparse
from datetime import datetime
import logging
import time
from zoneinfo import ZoneInfo
from sqlalchemy import select

from .cli import refresh
from .config import Settings
from .db import build_engine, build_session_factory
from .models import IngestionRun
from .repositories.snapshots import SnapshotRepository


def refresh_due(now, last_attempt, hour, minute):
    if now.weekday() >= 5 or (now.hour, now.minute) < (hour, minute):
        return False
    return last_attempt is None or last_attempt.astimezone(now.tzinfo).date() < now.date()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--env-file', default='backend/.env.local')
    args = parser.parse_args()
    settings = Settings(_env_file=args.env_file)
    logging.basicConfig(level=logging.INFO)
    factory = build_session_factory(build_engine(settings.database_url))
    repository = SnapshotRepository(factory)
    zone = ZoneInfo(settings.app_timezone)
    while True:
        try:
            with factory() as session:
                queued = session.scalar(select(IngestionRun).where(IngestionRun.status == 'QUEUED').order_by(IngestionRun.id).limit(1))
                latest = session.scalar(select(IngestionRun).order_by(IngestionRun.id.desc()).limit(1))
                run_id = queued.id if queued else None
                last_attempt = latest.requested_at if latest else None
            scheduled = run_id is None
            if scheduled and refresh_due(datetime.now(zone), last_attempt, settings.refresh_hour, settings.refresh_minute):
                run_id = repository.enqueue_refresh()['id']
            if run_id is not None:
                refresh(settings, run_id=run_id, skip_existing=scheduled)
        except Exception as error:
            logging.error('Refresh chưa hoàn tất (%s); giữ snapshot trước.', type(error).__name__)
        time.sleep(settings.worker_poll_seconds)


if __name__ == '__main__':
    main()
