from datetime import UTC, date, datetime, timedelta

from backend.app.providers.base import PriceBar
from backend.app.services.snapshot_builder import build_snapshot
from backend.app.universe.importer import UniverseRecord


def _bars(symbol: str, start: float, step: float) -> list[PriceBar]:
    first_date = date(2026, 1, 1)
    result = []
    for index in range(205):
        close = start + index * step
        result.append(
            PriceBar(
                symbol=symbol,
                trading_date=first_date + timedelta(days=index),
                open=close,
                high=close + 1,
                low=max(close - 1, 0.01),
                close=close,
                volume=500_000 + index,
            )
        )
    return result


def test_build_snapshot_produces_frontend_contract_from_normalized_bars() -> None:
    # R18: Lõi tính toán phải tạo được payload hoàn chỉnh mà không phụ thuộc Google Sheets.
    universe = [
        UniverseRecord(1, "Công nghệ", "AAA", "AAA Corp", "HOSE"),
        UniverseRecord(2, "Công nghệ", "BBB", "BBB Corp", "HOSE"),
        UniverseRecord(3, "Ngân hàng", "CCC", "CCC Bank", "HNX"),
    ]
    generated_at = datetime(2026, 9, 23, 10, 0, tzinfo=UTC)

    snapshot = build_snapshot(
        universe=universe,
        equity_bars={
            "AAA": _bars("AAA", 10, 1.0),
            "BBB": _bars("BBB", 20, 0.5),
            "CCC": _bars("CCC", 30, 0.1),
        },
        vnindex_bars=_bars("VNINDEX", 100, 0.05),
        generated_at=generated_at,
    )

    assert snapshot["asOfDate"] == "2026-07-24"
    assert snapshot["generatedAt"] == generated_at.isoformat()
    assert len(snapshot["sectors"]) == 2
    assert len(snapshot["strongStocks"]) == 3
    assert snapshot["dataStatus"] == {
        "source": "vnstock",
        "stale": False,
        "lastAttemptAt": generated_at.isoformat(),
        "warning": None,
    }
