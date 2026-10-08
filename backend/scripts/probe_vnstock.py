"""Kiểm tra khả năng dùng vnstock làm nguồn dữ liệu cuối ngày.

Script chỉ đọc Excel và API thị trường, sau đó ghi báo cáo tổng hợp. Nó không
ghi dữ liệu giá thô xuống đĩa và không thay đổi database.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
import time
from dataclasses import asdict, dataclass
from datetime import date, timedelta
from importlib.metadata import version
from pathlib import Path
from typing import Any

import pandas as pd
from openpyxl import load_workbook
from vnstock import Market


REQUIRED_UNIVERSE_COLUMNS = {"STT", "Nhóm ngành", "Mã CP", "Tên công ty", "Sàn"}
REQUIRED_OHLCV_COLUMNS = {"time", "open", "high", "low", "close", "volume"}


@dataclass(frozen=True)
class SymbolProbe:
    symbol: str
    status: str
    bars: int
    first_date: str | None
    last_date: str | None
    error: str | None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Kiểm tra nguồn vnstock cho CNF bulletin")
    parser.add_argument("--universe", type=Path, required=True)
    parser.add_argument("--expected", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--json-output", type=Path, required=True)
    parser.add_argument("--end", default=date.today().isoformat())
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--delay-seconds", type=float, default=1.05)
    return parser.parse_args()


def load_expected(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def load_universe(path: Path) -> list[dict[str, str]]:
    sheet = load_workbook(path, read_only=True, data_only=True).active
    rows = list(sheet.values)
    header_index = next(
        (
            index
            for index, row in enumerate(rows)
            if REQUIRED_UNIVERSE_COLUMNS.issubset({str(value).strip() for value in row if value})
        ),
        None,
    )
    if header_index is None:
        raise ValueError("Không tìm thấy hàng tiêu đề danh mục bắt buộc")

    headers = [str(value).strip() if value is not None else "" for value in rows[header_index]]
    records: list[dict[str, str]] = []
    for row in rows[header_index + 1 :]:
        record = {
            header: str(value).strip()
            for header, value in zip(headers, row, strict=False)
            if header and value is not None
        }
        if record.get("Mã CP"):
            records.append(record)

    symbols = [record["Mã CP"].upper() for record in records]
    if len(symbols) != len(set(symbols)):
        raise ValueError("Danh mục có mã cổ phiếu trùng")
    return records


def validate_frame(frame: pd.DataFrame, minimum_bars: int) -> None:
    missing = REQUIRED_OHLCV_COLUMNS.difference(frame.columns)
    if missing:
        raise ValueError(f"Thiếu cột OHLCV: {sorted(missing)}")
    if len(frame) < minimum_bars:
        raise ValueError(f"Chỉ có {len(frame)} phiên, cần tối thiểu {minimum_bars}")
    if frame["time"].duplicated().any():
        raise ValueError("Trùng ngày giao dịch")

    numeric = frame[["open", "high", "low", "close", "volume"]]
    if not numeric.map(math.isfinite).all().all():
        raise ValueError("OHLCV có NaN hoặc vô hạn")
    if (frame[["open", "high", "low", "close"]] <= 0).any().any():
        raise ValueError("Giá phải lớn hơn 0")
    if (frame["volume"] < 0).any():
        raise ValueError("Khối lượng không được âm")
    if (frame["high"] < frame[["open", "close", "low"]].max(axis=1)).any():
        raise ValueError("High nhỏ hơn giá thành phần")
    if (frame["low"] > frame[["open", "close", "high"]].min(axis=1)).any():
        raise ValueError("Low lớn hơn giá thành phần")


def fetch_with_retry(fetcher: Any, attempts: int, delay_seconds: float) -> pd.DataFrame:
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            return fetcher()
        except Exception as error:  # noqa: BLE001 - báo cáo lỗi nguồn theo từng mã
            last_error = error
            if attempt + 1 < attempts:
                time.sleep(delay_seconds * (attempt + 1))
    assert last_error is not None
    raise last_error


def probe_symbol(
    market: Market,
    symbol: str,
    start: str,
    end: str,
    bars: int,
    minimum_bars: int,
    source: str,
    attempts: int,
    delay_seconds: float,
) -> tuple[SymbolProbe, pd.DataFrame | None]:
    try:
        frame = fetch_with_retry(
            lambda: market.equity(symbol).ohlcv(
                start=start,
                end=end,
                interval="1D",
                count=bars,
                source=source,
            ),
            attempts,
            delay_seconds,
        )
        validate_frame(frame, minimum_bars)
        result = SymbolProbe(
            symbol=symbol,
            status="PASS",
            bars=len(frame),
            first_date=frame["time"].min().date().isoformat(),
            last_date=frame["time"].max().date().isoformat(),
            error=None,
        )
        return result, frame
    except Exception as error:  # noqa: BLE001 - cần phân loại toàn bộ 265 mã
        return (
            SymbolProbe(
                symbol=symbol,
                status="FAIL",
                bars=0,
                first_date=None,
                last_date=None,
                error=f"{type(error).__name__}: {error}",
            ),
            None,
        )


def check_adjustment_events(
    frames: dict[str, pd.DataFrame], events: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    evidence: list[dict[str, Any]] = []
    for event in events:
        frame = frames.get(event["symbol"])
        if frame is None:
            evidence.append({**event, "status": "FAIL", "reason": "Không có dữ liệu mã mẫu"})
            continue

        window = frame[
            (frame["time"] >= pd.Timestamp(event["windowStart"]))
            & (frame["time"] <= pd.Timestamp(event["windowEnd"]))
        ].copy()
        returns = window["close"].pct_change().abs().dropna()
        maximum = float(returns.max()) if not returns.empty else math.inf
        threshold = float(event["maximumAbsoluteReturn"])
        evidence.append(
            {
                **event,
                "observedMaximumAbsoluteReturn": round(maximum, 8),
                "status": "PASS" if maximum <= threshold else "FAIL",
                "reason": (
                    "Chuỗi không có bước nhảy kỹ thuật vượt ngưỡng quanh sự kiện"
                    if maximum <= threshold
                    else "Chuỗi có bước nhảy vượt ngưỡng quanh sự kiện"
                ),
            }
        )
    return evidence


def render_report(summary: dict[str, Any]) -> str:
    failed = [item for item in summary["symbols"] if item["status"] == "FAIL"]
    events = summary["adjustmentEvidence"]
    event_lines = "\n".join(
        f"- {item['symbol']} {item['recordDate']}: {item['status']} — "
        f"max |return| = {item.get('observedMaximumAbsoluteReturn', 'N/A')}"
        for item in events
    )
    failed_lines = "\n".join(
        f"- {item['symbol']}: {item['error']}" for item in failed
    ) or "- Không có"
    return f"""# Báo cáo probe nguồn vnstock

- Phiên bản: `{summary['packageVersion']}`
- Nguồn: `{summary['source']}`
- Số mã kiểm tra: {summary['checkedSymbols']}
- Số mã đạt: {summary['passedSymbols']}
- Độ phủ: {summary['coveragePercent']:.2f}%
- VNINDEX: {summary['vnindex']['status']}
- Bằng chứng giá điều chỉnh: {summary['adjustmentStatus']}
- Kết luận: {summary['overallStatus']}

## Đối chiếu sự kiện doanh nghiệp

{event_lines}

`EMPIRICAL_PASS` chỉ là bằng chứng thực nghiệm trên các sự kiện đã biết. Mỗi lần
nâng phiên bản package hoặc đổi nguồn phải chạy lại probe.

## Mã không đạt

{failed_lines}
"""


def main() -> int:
    args = parse_args()
    expected = load_expected(args.expected)
    records = load_universe(args.universe)
    symbols = [record["Mã CP"].upper() for record in records]
    if args.limit is not None:
        symbols = symbols[: args.limit]

    bars = int(expected["requestedBars"])
    minimum_bars = int(expected["minimumBars"])
    start = (date.fromisoformat(args.end) - timedelta(days=bars * 2)).isoformat()
    source = str(expected["source"])
    market = Market()
    results: list[SymbolProbe] = []
    frames: dict[str, pd.DataFrame] = {}

    for symbol in symbols:
        result, frame = probe_symbol(
            market=market,
            symbol=symbol,
            start=start,
            end=args.end,
            bars=bars,
            minimum_bars=minimum_bars,
            source=source,
            attempts=int(expected["attempts"]),
            delay_seconds=args.delay_seconds,
        )
        results.append(result)
        if frame is not None:
            frames[symbol] = frame
        time.sleep(args.delay_seconds)

    vnindex_result, _ = probe_symbol(
        market=market,
        symbol="VNINDEX",
        start=start,
        end=args.end,
        bars=bars,
        minimum_bars=minimum_bars,
        source=source,
        attempts=int(expected["attempts"]),
        delay_seconds=args.delay_seconds,
    )
    # Index dùng endpoint riêng; thử lại đúng lớp index nếu lớp equity từ chối.
    if vnindex_result.status == "FAIL":
        try:
            index_frame = fetch_with_retry(
                lambda: market.index("VNINDEX").ohlcv(
                    start=start,
                    end=args.end,
                    interval="1D",
                    count=bars,
                    source=source,
                ),
                int(expected["attempts"]),
                args.delay_seconds,
            )
            validate_frame(index_frame, minimum_bars)
            vnindex_result = SymbolProbe(
                symbol="VNINDEX",
                status="PASS",
                bars=len(index_frame),
                first_date=index_frame["time"].min().date().isoformat(),
                last_date=index_frame["time"].max().date().isoformat(),
                error=None,
            )
        except Exception as error:  # noqa: BLE001 - báo cáo gate nguồn
            vnindex_result = SymbolProbe(
                symbol="VNINDEX",
                status="FAIL",
                bars=0,
                first_date=None,
                last_date=None,
                error=f"{type(error).__name__}: {error}",
            )

    adjustment_evidence = check_adjustment_events(frames, expected["adjustmentEvents"])
    passed = sum(result.status == "PASS" for result in results)
    coverage = passed / len(results) if results else 0.0
    adjustment_passed = bool(adjustment_evidence) and all(
        item["status"] == "PASS" for item in adjustment_evidence
    )
    overall_passed = (
        coverage >= float(expected["minimumCoverage"])
        and vnindex_result.status == "PASS"
        and adjustment_passed
    )

    summary = {
        "package": "vnstock",
        "packageVersion": version("vnstock"),
        "source": source,
        "checkedSymbols": len(results),
        "passedSymbols": passed,
        "coveragePercent": coverage * 100,
        "symbols": [asdict(result) for result in results],
        "vnindex": asdict(vnindex_result),
        "adjustmentEvidence": adjustment_evidence,
        "adjustmentStatus": "EMPIRICAL_PASS" if adjustment_passed else "FAIL",
        "overallStatus": "PASS" if overall_passed else "FAIL",
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.json_output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(render_report(summary), encoding="utf-8")
    args.json_output.write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(render_report(summary))
    return 0 if overall_passed else 1


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
