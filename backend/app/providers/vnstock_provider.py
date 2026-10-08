"""Adapter duy nhất cho vnstock Community, khóa nguồn VCI đã qua probe."""

from __future__ import annotations

from datetime import date
from math import isfinite
from typing import Any
import time

import pandas as pd

from .base import PriceBar, ProviderDataError


REQUIRED_COLUMNS = frozenset({"time", "open", "high", "low", "close", "volume"})


class VnstockProvider:
    """Đọc OHLCV ngày và chuẩn hóa thành PriceBar."""

    def __init__(
        self,
        *,
        market: Any | None = None,
        source: str = "VCI",
        history_count: int = 700,
        max_attempts: int = 3,
        retry_delay: float = 3.0,
    ) -> None:
        if source.upper() != "VCI":
            raise ValueError("Backend chỉ cho phép nguồn VCI đã qua cổng kiểm chứng")
        self._source = "VCI"
        self._history_count = history_count
        self._max_attempts = max(1, max_attempts)
        self._retry_delay = retry_delay
        self._market = market
        self._quote_cls = None

        if self._market is None:
            try:
                from vnstock_data import Quote

                self._quote_cls = Quote
            except ImportError:
                from vnstock import Market

                self._market = Market()

    def _fetch_frame(self, symbol: str, *, start: date, end: date) -> pd.DataFrame:
        if self._quote_cls is not None:
            quote = self._quote_cls(symbol=symbol, source=self._source, show_log=False)
            return quote.history(
                start=start.isoformat(),
                end=end.isoformat(),
                interval="1D",
                count_back=self._history_count,
            )
        if symbol == "VNINDEX":
            series = self._market.index("VNINDEX")
        else:
            series = self._market.equity(symbol)
        return series.ohlcv(
            start=start.isoformat(),
            end=end.isoformat(),
            interval="1D",
            count=self._history_count,
            source=self._source,
        )

    def _fetch(
        self,
        *,
        symbol: str,
        start: date,
        end: date,
    ) -> list[PriceBar]:
        frame = None
        for attempt in range(self._max_attempts):
            try:
                frame = self._fetch_frame(symbol, start=start, end=end)
                break
            except Exception:
                if attempt + 1 == self._max_attempts:
                    raise
                time.sleep(self._retry_delay * (2 ** attempt))
        return _normalize_frame(frame, symbol)

    def fetch_equity(self, symbol: str, *, start: date, end: date) -> list[PriceBar]:
        normalized_symbol = symbol.strip().upper()
        return self._fetch(
            symbol=normalized_symbol,
            start=start,
            end=end,
        )

    def fetch_vnindex(self, *, start: date, end: date) -> list[PriceBar]:
        return self._fetch(
            symbol="VNINDEX",
            start=start,
            end=end,
        )


def _normalize_frame(frame: pd.DataFrame, symbol: str) -> list[PriceBar]:
    missing = REQUIRED_COLUMNS.difference(frame.columns)
    if missing:
        raise ProviderDataError(f"Thiếu cột OHLCV: {sorted(missing)}")
    normalized = frame.loc[:, list(REQUIRED_COLUMNS)].copy()
    normalized["time"] = pd.to_datetime(normalized["time"], errors="coerce").dt.normalize()
    if normalized["time"].isna().any():
        raise ProviderDataError("Ngày giao dịch không hợp lệ")
    if normalized["time"].duplicated().any():
        raise ProviderDataError("Trùng ngày giao dịch")
    normalized = normalized.sort_values("time")

    rows: list[PriceBar] = []
    for record in normalized.to_dict(orient="records"):
        values = [float(record[name]) for name in ("open", "high", "low", "close", "volume")]
        open_value, high, low, close, volume = values
        if not all(isfinite(value) for value in values):
            raise ProviderDataError("OHLCV có NaN hoặc vô hạn")
        if min(open_value, high, low, close) <= 0 or volume < 0:
            raise ProviderDataError("Giá phải dương và khối lượng không được âm")
        if high < max(open_value, low, close) or low > min(open_value, high, close):
            raise ProviderDataError("Quan hệ OHLC không hợp lệ")
        rows.append(
            PriceBar(
                symbol=symbol,
                trading_date=record["time"].date(),
                open=open_value,
                high=high,
                low=low,
                close=close,
                volume=volume,
            )
        )
    if not rows:
        raise ProviderDataError("Nguồn không trả bản ghi OHLCV")
    return rows
