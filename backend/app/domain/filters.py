"""Bộ lọc cổ phiếu mạnh và tiềm năng cho bản tin."""

from __future__ import annotations

from dataclasses import dataclass
from math import isfinite


MINIMUM_VOLUME = 300_000.0


@dataclass(frozen=True, slots=True)
class StockCandidate:
    """Dữ liệu đã tính toán cần thiết để chạy hai bộ lọc."""

    symbol: str
    sector: str
    close: float
    high_average_4: float
    volume: float
    volume_average_10: float
    rs_last_3: tuple[float, float, float]
    rs_average_3: float
    rs_ranking: float
    roc_26: float
    ma_20: float
    ma_50: float
    ma_50_slope_5: float

    @property
    def volume_ratio(self) -> float | None:
        if self.volume_average_10 == 0:
            return None
        return self.volume / self.volume_average_10


def _is_liquid_with_finite_strength(candidate: StockCandidate) -> bool:
    return (
        isfinite(candidate.volume)
        and isfinite(candidate.rs_ranking)
        and isfinite(candidate.roc_26)
        and candidate.volume > MINIMUM_VOLUME
    )


def select_strong_stocks(
    candidates: list[StockCandidate],
    *,
    vnindex_roc_26: float,
    limit: int = 10,
) -> list[StockCandidate]:
    """Chọn mã mạnh, rồi bổ sung mã gần ngưỡng ROC nếu chưa đủ giới hạn."""
    eligible = [
        candidate
        for candidate in candidates
        if _is_liquid_with_finite_strength(candidate)
    ]
    strict = sorted(
        (
            candidate
            for candidate in eligible
            if candidate.roc_26 > vnindex_roc_26
        ),
        key=lambda item: (-item.rs_ranking, -item.roc_26, item.symbol),
    )
    if len(strict) >= limit:
        return strict[:limit]

    strict_symbols = {candidate.symbol for candidate in strict}
    fills = sorted(
        (
            candidate
            for candidate in eligible
            if candidate.symbol not in strict_symbols
        ),
        key=lambda item: (
            vnindex_roc_26 - item.roc_26,
            -item.rs_ranking,
            -item.roc_26,
            item.symbol,
        ),
    )
    return (strict + fills)[:limit]


def _interval_distance(value: float, lower: float, upper: float) -> float:
    if value < lower:
        return (lower - value) / (upper - lower)
    if value > upper:
        return (value - upper) / (upper - lower)
    return 0.0


def _potential_conditions(
    candidate: StockCandidate,
    vnindex_roc_26: float,
) -> tuple[int, float]:
    volume_ratio = candidate.volume_ratio
    assert volume_ratio is not None

    rs_distances = [
        _interval_distance(value, 75.0, 90.0)
        for value in candidate.rs_last_3
    ]
    checks = [
        (all(distance == 0 for distance in rs_distances), sum(rs_distances)),
        (
            75.0 <= candidate.rs_average_3 <= 90.0,
            _interval_distance(candidate.rs_average_3, 75.0, 90.0),
        ),
        (
            10.0 <= candidate.roc_26 <= 20.0,
            _interval_distance(candidate.roc_26, 10.0, 20.0),
        ),
        (
            candidate.roc_26 > vnindex_roc_26,
            0.0
            if candidate.roc_26 > vnindex_roc_26
            else max(vnindex_roc_26 - candidate.roc_26, 0.0)
            / max(abs(vnindex_roc_26), 1.0),
        ),
        (candidate.close > candidate.ma_20, 0.0 if candidate.close > candidate.ma_20 else 1.0),
        (candidate.ma_20 > candidate.ma_50, 0.0 if candidate.ma_20 > candidate.ma_50 else 1.0),
        (candidate.ma_50_slope_5 > 0.0, 0.0 if candidate.ma_50_slope_5 > 0.0 else 1.0),
        (
            candidate.close > candidate.high_average_4,
            0.0 if candidate.close > candidate.high_average_4 else 1.0,
        ),
        (
            volume_ratio >= 1.5,
            0.0 if volume_ratio >= 1.5 else (1.5 - volume_ratio) / 1.5,
        ),
    ]
    return sum(not passed for passed, _ in checks), sum(
        distance for _, distance in checks
    )


def select_potential_stocks(
    candidates: list[StockCandidate],
    *,
    vnindex_roc_26: float,
    limit: int = 10,
) -> list[StockCandidate]:
    """Chọn mã tiềm năng và bổ sung theo số lỗi cùng khoảng cách chuẩn hóa."""
    eligible: list[StockCandidate] = []
    for candidate in candidates:
        volume_ratio = candidate.volume_ratio
        numeric_values = (
            candidate.close,
            candidate.high_average_4,
            candidate.volume,
            candidate.volume_average_10,
            *candidate.rs_last_3,
            candidate.rs_average_3,
            candidate.rs_ranking,
            candidate.roc_26,
            candidate.ma_20,
            candidate.ma_50,
            candidate.ma_50_slope_5,
        )
        if (
            candidate.volume > MINIMUM_VOLUME
            and volume_ratio is not None
            and isfinite(volume_ratio)
            and len(candidate.rs_last_3) == 3
            and all(isfinite(value) for value in numeric_values)
        ):
            eligible.append(candidate)

    scored = [
        (candidate, *_potential_conditions(candidate, vnindex_roc_26))
        for candidate in eligible
    ]
    strict = sorted(
        (item for item in scored if item[1] == 0),
        key=lambda item: (
            -item[0].rs_average_3,
            -item[0].roc_26,
            -float(item[0].volume_ratio),
            item[0].symbol,
        ),
    )
    if len(strict) >= limit:
        return [item[0] for item in strict[:limit]]

    fills = sorted(
        (item for item in scored if item[1] > 0),
        key=lambda item: (
            item[1],
            item[2],
            -item[0].rs_average_3,
            -item[0].roc_26,
            -float(item[0].volume_ratio),
            item[0].symbol,
        ),
    )
    return [item[0] for item in (strict + fills)[:limit]]
