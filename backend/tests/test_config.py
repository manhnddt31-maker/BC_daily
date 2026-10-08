import pytest

from backend.app.config import Settings


def test_settings_require_database_url_and_hide_service_token() -> None:
    # R11: Cấu hình thiếu bí mật phải fail-fast và không lộ token trong repr.
    settings = Settings(
        database_url="postgresql+psycopg://user:pass@db:5432/cnf",
        service_token="super-secret-token",
    )

    assert "super-secret-token" not in repr(settings)
    assert settings.vnstock_source == "VCI"


def test_settings_when_required_secret_missing_raises_error() -> None:
    with pytest.raises(ValueError):
        Settings(database_url="postgresql+psycopg://user:pass@db:5432/cnf")
