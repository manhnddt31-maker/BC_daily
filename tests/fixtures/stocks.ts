import type { StockRow } from "../../lib/types";

export function stock(overrides: Partial<StockRow> = {}): StockRow {
  return {
    ticker: "AAA",
    sector: "Ngân hàng",
    close: 120,
    highAvg4d: 110,
    volume: 500_000,
    averageVolume10d: 200_000,
    rsLast3: [80, 82, 84],
    rsAverage3d: 82,
    roc26: 15,
    ma20: 110,
    ma50: 100,
    ma50Slope5d: 1,
    ...overrides
  };
}
