import { describe, expect, it, vi } from "vitest";
import { readSheetRanges } from "../lib/google-sheets";

describe("readSheetRanges", () => {
  it("test_reads_multiple_configured_ranges_with_one_batch_request", async () => {
    const batchGet = vi.fn().mockResolvedValue({
      data: {
        valueRanges: [
          { range: "Data Clean!A:Q", values: [["Ticker"], ["AAA"]] },
          { range: "Ngành!A:C", values: [["Ngành"], ["Ngân hàng"]] }
        ]
      }
    });

    const result = await readSheetRanges(
      { spreadsheets: { values: { batchGet } } },
      "spreadsheet-id",
      ["'Data Clean'!A:Q", "'Ngành'!A:C"]
    );

    expect(batchGet).toHaveBeenCalledWith({
      spreadsheetId: "spreadsheet-id",
      ranges: ["'Data Clean'!A:Q", "'Ngành'!A:C"],
      valueRenderOption: "UNFORMATTED_VALUE"
    });
    expect(result).toHaveLength(2);
  });

  it("test_rejects_empty_range_before_calling_google", async () => {
    const batchGet = vi.fn();

    await expect(
      readSheetRanges(
        { spreadsheets: { values: { batchGet } } },
        "spreadsheet-id",
        ["'Data Clean'!A:Q", ""]
      )
    ).rejects.toThrow("Google Sheets range is not configured");
    expect(batchGet).not.toHaveBeenCalled();
  });
});
