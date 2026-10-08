"""Đọc và chuẩn hóa danh mục cổ phiếu từ tệp Excel CNF."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from openpyxl import load_workbook


REQUIRED_COLUMNS = ("STT", "Nhóm ngành", "Mã CP", "Tên công ty", "Sàn")
ALLOWED_EXCHANGES = frozenset({"HOSE", "HNX", "UPCOM"})


@dataclass(frozen=True, slots=True)
class UniverseRecord:
    order: int
    sector: str
    symbol: str
    company_name: str
    exchange: str


def load_universe_records(path: Path) -> list[UniverseRecord]:
    """Trả về các dòng danh mục đã chuẩn hóa từ workbook đầu vào."""
    sheet = load_workbook(path, read_only=True, data_only=True).active
    rows = list(sheet.values)
    header_index = next(
        (
            index
            for index, row in enumerate(rows)
            if set(REQUIRED_COLUMNS).issubset(
                {str(value).strip() for value in row if value is not None}
            )
        ),
        None,
    )
    if header_index is None:
        raise ValueError("Không tìm thấy hàng tiêu đề danh mục bắt buộc")

    headers = [str(value).strip() if value is not None else "" for value in rows[header_index]]
    records: list[UniverseRecord] = []
    seen_symbols: set[str] = set()
    for row in rows[header_index + 1 :]:
        values = dict(zip(headers, row, strict=False))
        symbol = str(values.get("Mã CP") or "").strip().upper()
        if not symbol:
            continue
        if symbol in seen_symbols:
            raise ValueError(f"Mã cổ phiếu trùng: {symbol}")
        seen_symbols.add(symbol)
        sector = str(values.get("Nhóm ngành") or "").strip()
        company_name = str(values.get("Tên công ty") or "").strip()
        order_value = values.get("STT")
        missing_fields = [
            field_name
            for field_name, field_value in (
                ("STT", order_value),
                ("Nhóm ngành", sector),
                ("Tên công ty", company_name),
            )
            if field_value is None or field_value == ""
        ]
        if missing_fields:
            raise ValueError(
                f"Mã {symbol} thiếu trường bắt buộc: {', '.join(missing_fields)}"
            )
        exchange = str(values.get("Sàn") or "").strip().upper()
        if exchange not in ALLOWED_EXCHANGES:
            raise ValueError(
                f"Sàn không hợp lệ cho mã {symbol}: {exchange or '(trống)'}"
            )
        records.append(
            UniverseRecord(
                order=int(order_value),
                sector=sector,
                symbol=symbol,
                company_name=company_name,
                exchange=exchange,
            )
        )
    if not records:
        raise ValueError("Danh mục không có mã cổ phiếu hợp lệ")
    return records
