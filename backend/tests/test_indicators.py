import json
from pathlib import Path

import pytest

from backend.app.analytics.indicators import (
    calculate_latest_indicators,
    percentile_rankings,
)


FIXTURE_PATH = Path(__file__).parent / "fixtures" / "indicator_cases.json"


def test_short_history_and_zero_volume_leave_unavailable_indicators_null():
    # Mã thiếu MA200 vẫn đóng góp vào MA ngắn; không chia khối lượng cho 0.
    result = calculate_latest_indicators(close=list(range(1, 61)), high=list(range(2, 62)), volume=[0] * 60)
    assert result.ma_200 is None
    assert result.ma_20 == pytest.approx(50.5)
    assert result.volume_ratio is None


def test_calculate_latest_indicators_matches_formula_oracle() -> None:
    # R6: Các cửa sổ MA/ROC/khối lượng phải dùng đúng phiên hiện tại và số phiên lùi.
    case = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))["linearSeries"]
    count = case["count"]
    close = [case["closeStart"] + index * case["closeStep"] for index in range(count)]
    high = [value + case["highOffset"] for value in close]
    volume = [
        case["volumeStart"] + index * case["volumeStep"]
        for index in range(count)
    ]

    result = calculate_latest_indicators(close=close, high=high, volume=volume)

    fields = {
        "roc9": "roc_9",
        "roc26": "roc_26",
        "roc33": "roc_33",
        "roc52": "roc_52",
        "ma10": "ma_10",
        "ma20": "ma_20",
        "ma50": "ma_50",
        "ma200": "ma_200",
        "highAverage4": "high_average_4",
        "volumeAverage10": "volume_average_10",
        "volumeRatio": "volume_ratio",
        "ma50Slope5": "ma_50_slope_5",
        "rsRaw": "rs_raw",
    }
    for fixture_field, result_field in fields.items():
        assert getattr(result, result_field) == pytest.approx(
            case["expected"][fixture_field]
        )


def test_percentile_rankings_use_average_ties_and_zero_to_one_hundred_scale() -> None:
    # R7: RS Ranking dùng percentile theo ngày và average rank cho các giá trị bằng nhau.
    case = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))["percentile"]

    result = percentile_rankings(case["rawScores"])

    assert result == pytest.approx(case["expectedRankings"])


def test_percentile_rankings_when_single_symbol_returns_one_hundred() -> None:
    # R8: Universe chỉ có một mã hợp lệ vẫn tạo được thứ hạng xác định.
    case = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))[
        "singleValidSymbol"
    ]

    result = percentile_rankings(case["rawScores"])

    assert result == pytest.approx(case["expectedRankings"])
