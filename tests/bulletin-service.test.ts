import { describe, expect, it } from "vitest";
import { buildBulletinSnapshot } from "../lib/bulletin-service";

describe("buildBulletinSnapshot", () => {
  it("test_reads_flattened_merged_headers_from_live_google_csv", () => {
    // Google CSV flattens grouped headers into the same cells as their semantic column labels.
    const rows = {
      stockRows: [
        [
          "Thông tin định danh và Ngành Cổ Phiếu",
          "Ngành",
          "Close",
          "High-TB4D",
          "Khối lượng giao dịch KLGD",
          "Vol-TB10D",
          "Vol vs 10D (%)",
          "Chỉ Số Sức Mạnh và Biến Động 17-08-2026",
          "14-08-2026",
          "13-08-2026",
          "RS-TB3D",
          "Roc26 (%)",
          "Các đường trung bình động MA10",
          "MA20",
          "MA50",
          "MA200",
          "MA50-TB5D MA50-TB5D",
          "Trend",
        ],
        ["AAA", "Ngân hàng", 120, 110, "500,000", 200000, 250, 80, 82, 84, 82, 15, 115, 110, 100, 90, 1, "Tăng"],
      ],
      sectorRows: [["Ngành", "TB Ngành (%)"], ["Ngân hàng", 1.25]],
      breadthRows: [["Date", "CP>MA10", "CP>MA20", "CP>MA50", "CP>MA200"], [46252, 70, 60, 50, 40]],
      vnIndexRows: [["Ticker", "Date/Time", "26D change (%)"], ["VNINDEX", 46252, 10]],
    };

    const snapshot = buildBulletinSnapshot(rows);

    expect(snapshot.potentialStocks).toEqual([
      expect.objectContaining({ ticker: "AAA", volume: 500000, ma50Slope5d: 1 }),
    ]);
  });

  it("test_reads_google_csv_with_two_header_rows", () => {
    const snapshot = buildBulletinSnapshot({
      stockRows: [
        ["Thông tin định danh và Ngành", "", "", "", "Khối lượng giao dịch"],
        ["Cổ Phiếu", "Ngành", "", "", "", "", "", "10-08-2026", "07-08-2026", "06-08-2026"],
        ["CTF", "Bán lẻ", "20.2", "19.26", "333,400", "360,610", "92.45%", "98.41", "98.41", "97.61", "98.14", "22.42", "18.52", "17.8", "17.59", "18.76", "0.15%"]
      ],
      sectorRows: [["Ngành", "TB Ngành (%)"], ["Bán lẻ", 1]],
      breadthRows: [["Date", "CP>MA10", "CP>MA20", "CP>MA50", "CP>MA200"], [46209, 70, 60, 50, 40]],
      vnIndexRows: [["Ticker", "Date/Time", "26D change (%)"], ["VNINDEX", 46209, 10]]
    });

    expect(snapshot.strongStocks.map((stock) => stock.ticker)).toEqual(["CTF"]);
  });

  it("test_uses_latest_vnindex_row_and_keeps_optional_narrative_null", () => {
    const snapshot = buildBulletinSnapshot({
      stockRows: [
        ["Cổ Phiếu", "Ngành", "Close", "High-TB4D", "KLGD", "Vol-TB10D", "RS1", "RS2", "RS3", "RS-TB3D", "Roc26 (%)", "MA20", "MA50", "MA50-TB5D"],
        ["AAA", "Ngân hàng", 120, 110, 500000, 200000, 80, 82, 84, 82, 15, 110, 100, 1]
      ],
      sectorRows: [["Ngành", "TB Ngành (%)"], ["Ngân hàng", 1.25]],
      breadthRows: [["Date", "CP>MA10", "CP>MA20", "CP>MA50", "CP>MA200"], [46209, 70, 60, 50, 40]],
      vnIndexRows: [["Ticker", "Date/Time", "26D change (%)"], ["VNINDEX", 46206, -1.07], ["VNINDEX", 46209, 10]]
    });

    expect(snapshot.vnIndexRoc26).toBe(10);
    expect(snapshot.asOfDate).toBe("2026-07-06");
    expect(snapshot.strongStocks.map((stock) => stock.ticker)).toEqual(["AAA"]);
    expect(snapshot.narrative).toBeNull();
  });

  it("reads the published sector and market-breadth layouts", () => {
    const snapshot = buildBulletinSnapshot({
      stockRows: [
        ["Cổ Phiếu", "Ngành", "Close", "High-TB4D", "KLGD", "Vol-TB10D", "RS1", "RS2", "RS3", "RS-TB3D", "Roc26 (%)", "MA20", "MA50", "MA50-TB5D"],
        ["AAA", "Ngân hàng", 120, 110, 500000, 200000, 80, 82, 84, 82, 15, 110, 100, 1],
      ],
      sectorRows: [
        ["", "Row Labels", "TB Ngành (%)"],
        ["", "Dầu khí", "-0.62"],
        ["", "Khoáng sản", "0.64"],
      ],
      breadthRows: [
        ["Row Labels", "CP>MA10", "CP>MA20", "CP>MA50", "CP>MA200"],
        ["10-08-2026", "86.29%", "70.04%", "33.47%", "23.17%"],
        ["07-08-2026", "79.60%", "51.42%", "25.90%", "20.73%"],
      ],
      vnIndexRows: [["Ticker", "Date/Time", "26D change (%)"], ["VNINDEX", 46209, 10]],
    });

    expect(snapshot.sectors).toEqual([
      { name: "Khoáng sản", averagePercent: 0.64 },
      { name: "Dầu khí", averagePercent: -0.62 },
    ]);
    expect(snapshot.marketBreadth).toEqual({ ma10: 86.29, ma20: 70.04, ma50: 33.47, ma200: 23.17 });
  });

  it("uses the latest VNINDEX date when Google Sheets publishes dd/mm/yyyy text", () => {
    const snapshot = buildBulletinSnapshot({
      stockRows: [
        ["Cổ Phiếu", "Ngành", "Close", "High-TB4D", "KLGD", "Vol-TB10D", "RS1", "RS2", "RS3", "RS-TB3D", "Roc26 (%)", "MA20", "MA50", "MA50-TB5D"],
        ["AAA", "Ngân hàng", 120, 110, 500000, 200000, 80, 82, 84, 82, 15, 110, 100, 1],
      ],
      sectorRows: [["Row Labels", "TB Ngành (%)"], ["Ngân hàng", 1]],
      breadthRows: [["Row Labels", "CP>MA10", "CP>MA20", "CP>MA50", "CP>MA200"], ["10-08-2026", 70, 60, 50, 40]],
      vnIndexRows: [["Ticker", "Date/Time", "26D change (%)"], ["VNINDEX", "06/07/2026", "(1.07)"], ["VNINDEX", "10/08/2026", 10]],
    });

    expect(snapshot.vnIndexRoc26).toBe(10);
    expect(snapshot.asOfDate).toBe("2026-08-10");
  });

  it("reads the non-padded m/d/yyyy date exported for VNINDEX by Google CSV", () => {
    const snapshot = buildBulletinSnapshot({
      stockRows: [
        ["Cổ Phiếu", "Ngành", "Close", "High-TB4D", "KLGD", "Vol-TB10D", "RS1", "RS2", "RS3", "RS-TB3D", "Roc26 (%)", "MA20", "MA50", "MA50-TB5D"],
        ["AAA", "Ngân hàng", 120, 110, 500000, 200000, 80, 82, 84, 82, 15, 110, 100, 1],
      ],
      sectorRows: [["Row Labels", "TB Ngành (%)"], ["Ngân hàng", 1]],
      breadthRows: [["Row Labels", "CP>MA10", "CP>MA20", "CP>MA50", "CP>MA200"], ["11-08-2026", 70, 60, 50, 40]],
      vnIndexRows: [["Ticker", "Date/Time", "26D change (%)"], ["VNINDEX", "8/11/2026", "(3.80)"]],
    });

    expect(snapshot.vnIndexRoc26).toBe(-3.8);
    expect(snapshot.asOfDate).toBe("2026-08-11");
  });

  it("reads parenthesized ROC26 values as negative numbers", () => {
    const snapshot = buildBulletinSnapshot({
      stockRows: [
        ["Cổ Phiếu", "Ngành", "Close", "High-TB4D", "KLGD", "Vol-TB10D", "RS1", "RS2", "RS3", "RS-TB3D", "Roc26 (%)", "MA20", "MA50", "MA50-TB5D"],
        ["AAA", "Ngân hàng", 120, 110, 500000, 200000, 80, 82, 84, 82, 15, 110, 100, 1],
      ],
      sectorRows: [["Row Labels", "TB Ngành (%)"], ["Ngân hàng", 1]],
      breadthRows: [["Row Labels", "CP>MA10", "CP>MA20", "CP>MA50", "CP>MA200"], ["10-08-2026", 70, 60, 50, 40]],
      vnIndexRows: [["Ticker", "Date/Time", "26D change (%)"], ["VNINDEX", "06/07/2026", "(1.07)"]],
    });

    expect(snapshot.vnIndexRoc26).toBe(-1.07);
  });

  it("test_uses_published_narrative_matching_snapshot_date", () => {
    // A published Web_Bulletin row for the snapshot date must be included.
    const rows = {
      stockRows: [
        ["Cổ Phiếu", "Ngành", "Close", "High-TB4D", "KLGD", "Vol-TB10D", "RS1", "RS2", "RS3", "RS-TB3D", "Roc26 (%)", "MA20", "MA50", "MA50-TB5D"],
        ["AAA", "Ngân hàng", 120, 110, 500000, 200000, 80, 82, 84, 82, 15, 110, 100, 1],
      ],
      sectorRows: [["Row Labels", "TB Ngành (%)"], ["Ngân hàng", 1]],
      breadthRows: [["Row Labels", "CP>MA10", "CP>MA20", "CP>MA50", "CP>MA200"], ["10-08-2026", 70, 60, 50, 40]],
      vnIndexRows: [["Ticker", "Date/Time", "26D change (%)"], ["VNINDEX", "10/08/2026", 10]],
      narrativeRows: [
        ["as_of_date", "status", "conclusion", "action", "footer"],
        ["10/08/2026", "published", "Thị trường duy trì đà phục hồi.", "Duy trì tỷ trọng hợp lý.", "Không phải khuyến nghị mua bán."],
      ],
    } as unknown as Parameters<typeof buildBulletinSnapshot>[0];

    const snapshot = buildBulletinSnapshot(rows);

    expect(snapshot.narrative).toEqual({
      conclusion: "Thị trường duy trì đà phục hồi.",
      action: "Duy trì tỷ trọng hợp lý.",
      footer: "Không phải khuyến nghị mua bán.",
    });
  });

  it("test_required_source_with_wrong_google_fallback_schema_is_rejected", () => {
    // Google can return the first tab with HTTP 200 when a requested tab is missing.
    const build = () => buildBulletinSnapshot({
      stockRows: [["unexpected", "fallback", "tab"]],
      sectorRows: [["Row Labels", "TB Ngành (%)"], ["Ngân hàng", 1]],
      breadthRows: [["Row Labels", "CP>MA10", "CP>MA20", "CP>MA50", "CP>MA200"], ["11-08-2026", 70, 60, 50, 40]],
      vnIndexRows: [["Ticker", "Date/Time", "26D change (%)"], ["VNINDEX", "8/11/2026", -3.8]],
    });

    expect(build).toThrow(/Data Clean.*schema/iu);
  });

  it("test_required_stock_source_rejects_a_wide_unrelated_fallback_tab", () => {
    // A wide Google fallback tab is not valid unless it has the Data Clean headers.
    const build = () => buildBulletinSnapshot({
      stockRows: [
        ["Ticker", "Date/Time", "26D change (%)", "x4", "x5", "x6", "x7", "x8", "x9", "x10", "x11", "x12", "x13", "x14"],
        ["VNINDEX", "8/11/2026", -3.8, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      ],
      sectorRows: [["Row Labels", "TB Ngành (%)"], ["Ngân hàng", 1]],
      breadthRows: [["Row Labels", "CP>MA10", "CP>MA20", "CP>MA50", "CP>MA200"], ["11-08-2026", 70, 60, 50, 40]],
      vnIndexRows: [["Ticker", "Date/Time", "26D change (%)"], ["VNINDEX", "8/11/2026", -3.8]],
    });

    expect(build).toThrow(/Data Clean.*schema/iu);
  });

  it("test_optional_narrative_with_wrong_google_fallback_schema_is_ignored", () => {
    // The optional narrative tab must not take down otherwise valid market data.
    const snapshot = buildBulletinSnapshot({
      stockRows: [
        ["Cổ Phiếu", "Ngành", "Close", "High-TB4D", "KLGD", "Vol-TB10D", "RS1", "RS2", "RS3", "RS-TB3D", "Roc26 (%)", "MA20", "MA50", "MA50-TB5D"],
        ["AAA", "Ngân hàng", 120, 110, 500000, 200000, 80, 82, 84, 82, 15, 110, 100, 1],
      ],
      sectorRows: [["Row Labels", "TB Ngành (%)"], ["Ngân hàng", 1]],
      breadthRows: [["Row Labels", "CP>MA10", "CP>MA20", "CP>MA50", "CP>MA200"], ["11-08-2026", 70, 60, 50, 40]],
      vnIndexRows: [["Ticker", "Date/Time", "26D change (%)"], ["VNINDEX", "8/11/2026", -3.8]],
      narrativeRows: [["Cổ Phiếu", "Ngành", "Close"], ["AAA", "Ngân hàng", 120]],
    });

    expect(snapshot.narrative).toBeNull();
  });
});
