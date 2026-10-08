"""Tính các chỉ báo kỹ thuật từ chuỗi dữ liệu đã sắp xếp tăng dần theo ngày."""

from __future__ import annotations

from dataclasses import dataclass
from statistics import fmean
from typing import Mapping, Sequence


@dataclass(frozen=True, slots=True)
class LatestIndicators:
    """Giá trị chỉ báo tại phiên mới nhất của một mã."""

    roc_9: float | None
    roc_26: float | None
    roc_33: float | None
    roc_52: float | None
    ma_10: float | None
    ma_20: float | None
    ma_50: float | None
    ma_200: float | None
    high_average_4: float | None
    volume_average_10: float | None
    volume_ratio: float | None
    ma_50_slope_5: float | None
    rs_raw: float | None


def percentile_rankings(raw_scores: Mapping[str, float]) -> dict[str, float]:
    """Xếp hạng percentile 0–100, dùng vị trí trung bình khi đồng điểm."""
    if not raw_scores:
        return {}
    if len(raw_scores) == 1:
        symbol = next(iter(raw_scores))
        return {symbol: 100.0}

    sorted_items = sorted(raw_scores.items(), key=lambda item: (item[1], item[0]))
    positions_by_score: dict[float, list[int]] = {}
    for position, (_, score) in enumerate(sorted_items):
        positions_by_score.setdefault(float(score), []).append(position)

    scale = 100.0 / (len(sorted_items) - 1)
    ranking_by_score = {
        score: fmean(positions) * scale
        for score, positions in positions_by_score.items()
    }
    return {
        symbol: ranking_by_score[float(score)]
        for symbol, score in raw_scores.items()
    }


def _roc(values: Sequence[float], periods: int) -> float | None:
    if len(values) <= periods:
        return None
    previous = float(values[-(periods + 1)])
    if previous == 0:
        return None
    return (float(values[-1]) - previous) / previous * 100.0


def calculate_latest_indicators(
    *,
    close: Sequence[float],
    high: Sequence[float],
    volume: Sequence[float],
) -> LatestIndicators:
    """Tính bộ chỉ báo mới nhất theo công thức đã được phê duyệt."""
    if not (len(close) == len(high) == len(volume)):
        raise ValueError("Các chuỗi close, high và volume phải có cùng số phiên")
    if not len(close):
        raise ValueError('Chuỗi giá rỗng')

    roc_9 = _roc(close, 9)
    roc_26 = _roc(close, 26)
    roc_33 = _roc(close, 33)
    roc_52 = _roc(close, 52)
    ma_10 = fmean(close[-10:]) if len(close) >= 10 else None
    ma_20 = fmean(close[-20:]) if len(close) >= 20 else None
    ma_50 = fmean(close[-50:]) if len(close) >= 50 else None
    ma_200 = fmean(close[-200:]) if len(close) >= 200 else None
    previous_ma = fmean(close[-55:-5]) if len(close) >= 55 else None
    high_average_4 = fmean(high[-4:]) if len(high) >= 4 else None
    volume_average_10 = fmean(volume[-10:]) if len(volume) >= 10 else None
    volume_ratio = float(volume[-1]) / volume_average_10 if volume_average_10 else None
    ma_50_slope_5 = (ma_50 - previous_ma) / previous_ma if previous_ma else None
    rocs = (roc_9, roc_26, roc_33, roc_52)
    rs_raw = sum(weight * value for weight, value in zip((0.4, 0.2, 0.2, 0.2), rocs)) if all(value is not None for value in rocs) else None

    return LatestIndicators(
        roc_9=roc_9,
        roc_26=roc_26,
        roc_33=roc_33,
        roc_52=roc_52,
        ma_10=ma_10,
        ma_20=ma_20,
        ma_50=ma_50,
        ma_200=ma_200,
        high_average_4=high_average_4,
        volume_average_10=volume_average_10,
        volume_ratio=volume_ratio,
        ma_50_slope_5=ma_50_slope_5,
        rs_raw=rs_raw,
    )
