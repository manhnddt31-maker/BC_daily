import json
from pathlib import Path

from backend.app.domain.filters import (
    StockCandidate,
    select_potential_stocks,
    select_strong_stocks,
)


FIXTURE_PATH = Path(__file__).parent / "fixtures" / "filter_cases.json"


def _candidate(base: dict[str, object], override: dict[str, object]) -> StockCandidate:
    values = {**base, **override}
    return StockCandidate(
        symbol=str(values["ticker"]),
        sector=str(values["sector"]),
        close=float(values["close"]),
        high_average_4=float(values["highAvg4d"]),
        volume=float(values["volume"]),
        volume_average_10=float(values["averageVolume10d"]),
        rs_last_3=tuple(float(value) for value in values["rsLast3"]),
        rs_average_3=float(values["rsAverage3d"]),
        rs_ranking=float(values["rsRanking"]),
        roc_26=float(values["roc26"]),
        ma_20=float(values["ma20"]),
        ma_50=float(values["ma50"]),
        ma_50_slope_5=float(values["ma50Slope5d"]),
    )


def test_select_strong_stocks_puts_strict_before_nearest_liquid_fills() -> None:
    # R9: Điều kiện thanh khoản là cứng; mã nghiêm ngặt luôn đứng trước mã bổ sung.
    fixture = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
    candidates = [
        _candidate(fixture["base"], item)
        for item in fixture["strong"]["symbols"]
    ]

    result = select_strong_stocks(
        candidates,
        vnindex_roc_26=float(fixture["vnIndexRoc26"]),
        limit=10,
    )

    assert [item.symbol for item in result] == fixture["strong"]["expectedOrder"]


def test_select_potential_stocks_orders_strict_then_nearest_candidates() -> None:
    # R10: Mã tiềm năng đủ chuẩn đứng trước, phần bổ sung dùng khoảng cách quyết định.
    fixture = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
    candidates = [
        _candidate(fixture["base"], item)
        for item in fixture["potential"]["symbols"]
    ]

    result = select_potential_stocks(
        candidates,
        vnindex_roc_26=float(fixture["vnIndexRoc26"]),
        limit=10,
    )

    assert [item.symbol for item in result] == fixture["potential"]["expectedOrder"]
