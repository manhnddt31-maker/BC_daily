"""Cấu hình typed của backend, đọc từ biến môi trường hoặc tệp .env."""

from pathlib import Path
from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Các giá trị vận hành bắt buộc và mặc định an toàn."""

    database_url: str
    service_token: SecretStr
    vnstock_source: Literal["VCI"] = "VCI"
    universe_path: Path = Path("/data/CNF_Phan_nganh_Co_phieu.xlsx")
    app_timezone: str = "Asia/Ho_Chi_Minh"
    refresh_hour: int = 16
    refresh_minute: int = 30
    history_count: int = 700
    request_delay: float = 1.1
    minimum_coverage: float = 0.95
    history_days: int = 1500
    worker_poll_seconds: int = 10
    source_max_attempts: int = 3
    source_retry_delay: float = 3.0
    supabase_url: str | None = None
    supabase_secret_key: SecretStr | None = None
    supabase_timeout_seconds: float = 15.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )
