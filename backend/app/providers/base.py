"""Kiểu dữ liệu chuẩn độc lập với thư viện cung cấp dữ liệu."""

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True, slots=True)
class PriceBar:
    symbol: str
    trading_date: date
    open: float
    high: float
    low: float
    close: float
    volume: float


class ProviderDataError(ValueError):
    """Nguồn trả dữ liệu sai schema hoặc sai quan hệ OHLCV."""
