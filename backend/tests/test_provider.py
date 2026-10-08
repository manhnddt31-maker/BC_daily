from datetime import date

import pandas as pd
import pytest

from backend.app.providers.base import ProviderDataError
from backend.app.providers.vnstock_provider import VnstockProvider


class _FakeSeries:
    def __init__(self, frame: pd.DataFrame) -> None:
        self.frame = frame
        self.calls: list[dict[str, object]] = []

    def ohlcv(self, **kwargs: object) -> pd.DataFrame:
        self.calls.append(kwargs)
        return self.frame.copy()


class _FakeMarket:
    def __init__(self, frame: pd.DataFrame) -> None:
        self.equity_series = _FakeSeries(frame)
        self.index_series = _FakeSeries(frame)
        self.requested_equity: str | None = None
        self.requested_index: str | None = None

    def equity(self, symbol: str) -> _FakeSeries:
        self.requested_equity = symbol
        return self.equity_series

    def index(self, symbol: str) -> _FakeSeries:
        self.requested_index = symbol
        return self.index_series


def _valid_frame() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "time": pd.to_datetime(["2026-09-22", "2026-09-23"]),
            "open": [10.0, 11.0],
            "high": [11.0, 12.0],
            "low": [9.0, 10.0],
            "close": [10.5, 11.5],
            "volume": [400_000.0, 500_000.0],
        }
    )


def test_transient_network_failure_is_retried_with_bounded_attempts():
    # Mạng lỗi một lần không loại ngay một mã hợp lệ.
    from unittest.mock import Mock
    market = _FakeMarket(_valid_frame())
    market.equity_series.ohlcv = Mock(side_effect=[TimeoutError(), _valid_frame()])
    provider = VnstockProvider(market=market, retry_delay=0, max_attempts=2)
    rows = provider.fetch_equity('FPT', start=date(2024, 1, 1), end=date(2026, 9, 23))
    assert len(rows) == 2
    assert market.equity_series.ohlcv.call_count == 2


def test_fetch_equity_normalizes_rows_and_requests_explicit_history_count() -> None:
    # R12: Không dựa vào count mặc định 100 của vnstock; nguồn luôn bị khóa ở VCI.
    market = _FakeMarket(_valid_frame())
    provider = VnstockProvider(market=market, source="VCI", history_count=700)

    rows = provider.fetch_equity(
        "fpt",
        start=date(2024, 1, 1),
        end=date(2026, 9, 23),
    )

    assert [row.trading_date.isoformat() for row in rows] == [
        "2026-09-22",
        "2026-09-23",
    ]
    assert market.requested_equity == "FPT"
    assert market.equity_series.calls == [
        {
            "start": "2024-01-01",
            "end": "2026-09-23",
            "interval": "1D",
            "count": 700,
            "source": "VCI",
        }
    ]


def test_fetch_equity_when_schema_missing_column_raises_provider_error() -> None:
    # R13: Schema nguồn thay đổi phải dừng ngay, không ánh xạ cột theo suy đoán.
    market = _FakeMarket(_valid_frame().drop(columns=["volume"]))
    provider = VnstockProvider(market=market)

    with pytest.raises(ProviderDataError, match="volume"):
        provider.fetch_equity(
            "FPT",
            start=date(2024, 1, 1),
            end=date(2026, 9, 23),
        )
