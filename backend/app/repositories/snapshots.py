"""Đọc snapshot công bố và xếp hàng refresh."""

from __future__ import annotations

from copy import deepcopy
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select, text
from sqlalchemy.orm import Session, sessionmaker

from ..models import BulletinSnapshot, IngestionRun


class SnapshotRepository:
    def __init__(self, factory: sessionmaker[Session]) -> None:
        self._factory = factory

    def latest(self) -> dict[str, Any] | None:
        with self._factory() as session:
            snapshot = session.scalar(
                select(BulletinSnapshot).join(IngestionRun, IngestionRun.id == BulletinSnapshot.ingestion_run_id)
                .where(IngestionRun.status == 'SUCCEEDED').order_by(
                    BulletinSnapshot.published_at.desc(),
                    BulletinSnapshot.revision.desc(),
                ).limit(1)
            )
            if snapshot is None:
                return None
            payload = deepcopy(snapshot.payload)
            latest_attempt = session.scalar(
                select(IngestionRun).where(IngestionRun.status.in_(['SUCCEEDED', 'FAILED', 'NO_NEW_SESSION']))
                .order_by(IngestionRun.requested_at.desc()).limit(1)
            )
            if latest_attempt is not None and latest_attempt.status == "FAILED":
                status = payload.setdefault("dataStatus", {})
                status["stale"] = True
                status["lastAttemptAt"] = latest_attempt.requested_at.isoformat()
                status["warning"] = "Lần cập nhật mới nhất thất bại; đang dùng snapshot gần nhất."
            return payload

    def enqueue_refresh(self) -> dict[str, Any]:
        with self._factory.begin() as session:
            if session.bind.dialect.name == 'postgresql':
                # Serialize enqueue để hai request đồng thời dùng chung một job.
                session.execute(text('SELECT pg_advisory_xact_lock(:key)'), {'key': 436_260_924})
            existing = session.scalar(
                select(IngestionRun)
                .where(IngestionRun.status.in_(["QUEUED", "RUNNING"]))
                .order_by(IngestionRun.requested_at.asc())
                .limit(1)
            )
            if existing is not None:
                return {"id": existing.id, "status": existing.status}
            run = IngestionRun(
                status="QUEUED",
                requested_at=datetime.now(UTC),
                source="VCI",
            )
            session.add(run)
            session.flush()
            return {"id": run.id, "status": run.status}
