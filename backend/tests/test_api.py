import json
from pathlib import Path

from fastapi.testclient import TestClient

from backend.app.config import Settings
from backend.app.main import create_app


FIXTURE_PATH = (
    Path(__file__).parents[2] / "tests" / "fixtures" / "bulletin-snapshot-contract.json"
)


def _settings() -> Settings:
    return Settings(
        database_url="postgresql+psycopg://user:pass@db:5432/cnf",
        service_token="test-service-token",
    )


def test_latest_bulletin_requires_bearer_token_and_never_echoes_it() -> None:
    # R17/R19: Snapshot chỉ dành cho Next.js server và bí mật không được trả về client.
    snapshot = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
    client = TestClient(create_app(_settings(), snapshot_reader=lambda: snapshot))

    assert client.get("/api/v1/bulletin/latest").status_code == 401
    response = client.get(
        "/api/v1/bulletin/latest",
        headers={"Authorization": "Bearer test-service-token"},
    )

    assert response.status_code == 200
    assert response.json()["dataStatus"]["source"] == "vnstock"
    assert "test-service-token" not in response.text


def test_latest_bulletin_when_no_snapshot_returns_structured_503() -> None:
    client = TestClient(create_app(_settings(), snapshot_reader=lambda: None))

    response = client.get(
        "/api/v1/bulletin/latest",
        headers={"Authorization": "Bearer test-service-token"},
    )

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "NO_SNAPSHOT"
