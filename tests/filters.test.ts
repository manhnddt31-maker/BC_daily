import { describe, expect, it } from "vitest";
import { selectPotentialStocks, selectStrongStocks } from "../lib/filters";
import { stock } from "./fixtures/stocks";

describe("selectStrongStocks", () => {
  it("test_returns_top_ten_when_volume_and_roc26_beat_vnindex", () => {
    const stocks = [
      stock({ ticker: "LOW", rsAverage3d: 76 }),
      stock({ ticker: "HIGH", rsAverage3d: 90 }),
      stock({ ticker: "ILLQ", volume: 300_000, rsAverage3d: 99 }),
      stock({ ticker: "WEAK", roc26: 8, rsAverage3d: 98 })
    ];

    expect(selectStrongStocks(stocks, 10).map(({ ticker }) => ticker)).toEqual([
      "HIGH",
      "LOW"
    ]);
  });
});

describe("selectPotentialStocks", () => {
  it("test_prioritizes_strict_candidates_then_fills_with_near_misses_without_metadata", () => {
    const stocks = [
      stock({ ticker: "STRICT", rsAverage3d: 88, roc26: 18 }),
      stock({ ticker: "NEAR", rsAverage3d: 86, roc26: 17, ma50Slope5d: 0 }),
      stock({ ticker: "OUTSIDE_RS", rsLast3: [74, 86, 86], rsAverage3d: 86 })
    ];

    expect(selectPotentialStocks(stocks, 10).map(({ ticker }) => ticker)).toEqual([
      "STRICT",
      "NEAR",
      "OUTSIDE_RS"
    ]);
  });

  it("test_rejects_invalid_volume_ratio_from_strict_selection", () => {
    const result = selectPotentialStocks(
      [stock({ ticker: "ZERO", averageVolume10d: 0 })],
      10
    );

    expect(result).toEqual([]);
  });
});
