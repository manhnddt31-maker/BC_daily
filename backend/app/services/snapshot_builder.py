"""Tạo payload bản tin từ OHLCV đã chuẩn hóa, không thực hiện I/O."""

from __future__ import annotations

from datetime import UTC, datetime
from math import isfinite

from ..analytics.indicators import LatestIndicators, calculate_latest_indicators, percentile_rankings
from ..domain.aggregates import BreadthObservation, SectorObservation, aggregate_sector_strength, calculate_market_breadth
from ..domain.filters import StockCandidate, select_potential_stocks, select_strong_stocks
from ..providers.base import PriceBar
from ..universe.importer import UniverseRecord


def _indicator(bars: list[PriceBar]) -> LatestIndicators:
    return calculate_latest_indicators(
        close=[bar.close for bar in bars],
        high=[bar.high for bar in bars],
        volume=[bar.volume for bar in bars],
    )


def _stock_payload(candidate: StockCandidate) -> dict[str, object]:
    return {
        "ticker": candidate.symbol,
        "sector": candidate.sector,
        "close": candidate.close,
        "highAvg4d": candidate.high_average_4,
        "volume": candidate.volume,
        "averageVolume10d": candidate.volume_average_10,
        "rsLast3": list(candidate.rs_last_3),
        "rsAverage3d": candidate.rs_average_3,
        "roc26": candidate.roc_26,
        "ma20": candidate.ma_20,
        "ma50": candidate.ma_50,
        "ma50Slope5d": candidate.ma_50_slope_5,
    }


def build_snapshot(
    *,
    universe: list[UniverseRecord],
    equity_bars: dict[str, list[PriceBar]],
    vnindex_bars: list[PriceBar],
    generated_at: datetime | None = None,
) -> dict[str, object]:
    """Tính một snapshot tại phiên VNINDEX mới nhất có trong đầu vào."""
    vnindex_bars = sorted(vnindex_bars, key=lambda bar: bar.trading_date)
    if len(vnindex_bars) < 27:
        raise ValueError("VNINDEX không đủ 27 phiên để tính ROC26")
    market_dates = [bar.trading_date for bar in sorted(vnindex_bars, key=lambda bar: bar.trading_date)]
    target_dates = market_dates[-3:]
    indicators_by_day: list[dict[str, LatestIndicators]] = []
    rankings_by_day: list[dict[str, float]] = []

    universe_by_symbol = {record.symbol: record for record in universe}
    normalized_bars = {
        symbol.upper(): sorted(bars, key=lambda bar: bar.trading_date)
        for symbol, bars in equity_bars.items() if symbol.upper() in universe_by_symbol
    }
    for target_date in target_dates:
        day_indicators: dict[str, LatestIndicators] = {}
        for symbol, bars in normalized_bars.items():
            history = [bar for bar in bars if bar.trading_date <= target_date]
            if history and history[-1].trading_date == target_date:
                day_indicators[symbol] = _indicator(history)
        indicators_by_day.append(day_indicators)
        rankings_by_day.append(
            percentile_rankings(
                {symbol: value.rs_raw for symbol, value in day_indicators.items() if value.rs_raw is not None and isfinite(value.rs_raw)}
            )
        )

    latest_indicators = indicators_by_day[-1]
    latest_rankings = rankings_by_day[-1]
    universe_by_symbol = {record.symbol: record for record in universe}
    candidates: list[StockCandidate] = []
    sector_inputs: list[SectorObservation] = []
    breadth_inputs: list[BreadthObservation] = []
    target_date = target_dates[-1]

    for symbol, indicator in latest_indicators.items():
        record = universe_by_symbol.get(symbol)
        bars = normalized_bars[symbol]
        latest_bar = next((bar for bar in reversed(bars) if bar.trading_date <= target_date), None)
        if record is None or latest_bar is None or latest_bar.trading_date != target_date:
            continue
        sector_inputs.append(SectorObservation(record.sector, indicator.roc_26))
        breadth_inputs.append(BreadthObservation(close=latest_bar.close,
            ma_10=indicator.ma_10, ma_20=indicator.ma_20,
            ma_50=indicator.ma_50, ma_200=indicator.ma_200))
        if not all(symbol in day for day in rankings_by_day):
            continue
        if any(value is None for value in (indicator.high_average_4, indicator.volume_average_10,
                                           indicator.roc_26, indicator.ma_20, indicator.ma_50, indicator.ma_50_slope_5)):
            continue
        rs_last_3 = tuple(day[symbol] for day in rankings_by_day)
        candidate = StockCandidate(
            symbol=symbol,
            sector=record.sector,
            close=latest_bar.close,
            high_average_4=indicator.high_average_4,
            volume=latest_bar.volume,
            volume_average_10=indicator.volume_average_10,
            rs_last_3=rs_last_3,  # type: ignore[arg-type]
            rs_average_3=sum(rs_last_3) / 3,
            rs_ranking=latest_rankings[symbol],
            roc_26=indicator.roc_26,
            ma_20=indicator.ma_20,
            ma_50=indicator.ma_50,
            ma_50_slope_5=indicator.ma_50_slope_5,
        )
        candidates.append(candidate)

    if not breadth_inputs:
        raise ValueError("Không có mã hợp lệ tại phiên mục tiêu")
    vnindex_history = [bar for bar in vnindex_bars if bar.trading_date <= target_date]
    vnindex_roc_26 = _indicator(vnindex_history).roc_26
    breadth = calculate_market_breadth(breadth_inputs)
    created = generated_at or datetime.now(UTC)
    return {
        "asOfDate": target_date.isoformat(),
        "generatedAt": created.isoformat(),
        "vnIndexRoc26": vnindex_roc_26,
        "sectors": [
            {"name": item.name, "averagePercent": item.average_percent}
            for item in aggregate_sector_strength(sector_inputs)
        ],
        "strongStocks": [
            _stock_payload(item)
            for item in select_strong_stocks(candidates, vnindex_roc_26=vnindex_roc_26)
        ],
        "potentialStocks": [
            _stock_payload(item)
            for item in select_potential_stocks(candidates, vnindex_roc_26=vnindex_roc_26)
        ],
        "marketBreadth": {
            "ma10": breadth.ma_10.percentage,
            "ma20": breadth.ma_20.percentage,
            "ma50": breadth.ma_50.percentage,
            "ma200": breadth.ma_200.percentage,
        },
        "narrative": None,
        "dataStatus": {
            "source": "vnstock",
            "stale": False,
            "lastAttemptAt": created.isoformat(),
            "warning": None,
        },
    }
