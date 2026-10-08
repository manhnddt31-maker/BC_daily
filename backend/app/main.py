"""FastAPI application phục vụ snapshot bản tin và điều phối refresh."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from fastapi import Depends, FastAPI, status
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import Settings
from .db import build_engine, build_session_factory
from .repositories.snapshots import SnapshotRepository
from .security import require_service_token


SnapshotReader = Callable[[], dict[str, Any] | None]
RefreshEnqueuer = Callable[[], dict[str, Any]]


def create_app(
    settings: Settings | None = None,
    *,
    snapshot_reader: SnapshotReader | None = None,
    refresh_enqueuer: RefreshEnqueuer | None = None,
) -> FastAPI:
    config = settings or Settings()  # type: ignore[call-arg]
    repository: SnapshotRepository | None = None
    if snapshot_reader is None or refresh_enqueuer is None:
        repository = SnapshotRepository(
            build_session_factory(build_engine(config.database_url))
        )
    read_snapshot = snapshot_reader or repository.latest  # type: ignore[union-attr]
    enqueue_refresh = refresh_enqueuer or repository.enqueue_refresh  # type: ignore[union-attr]
    bearer = HTTPBearer(auto_error=False)
    app = FastAPI(title="CNF Daily Market Backend", version="0.1.0")

    def authorize(
        credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    ) -> None:
        require_service_token(
            credentials,
            config.service_token.get_secret_value(),
        )

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get(
        "/api/v1/bulletin/latest",
        dependencies=[Depends(authorize)],
        response_model=None,
    )
    def latest_bulletin() -> dict[str, Any] | JSONResponse:
        snapshot = read_snapshot()
        if snapshot is None:
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={
                    "error": {
                        "code": "NO_SNAPSHOT",
                        "message": "Dữ liệu bản tin chưa sẵn sàng.",
                    }
                },
            )
        return snapshot

    @app.post(
        "/api/v1/jobs/refresh",
        dependencies=[Depends(authorize)],
        status_code=status.HTTP_202_ACCEPTED,
    )
    def refresh() -> dict[str, Any]:
        return enqueue_refresh()

    return app
