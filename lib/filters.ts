import {
  BULLETIN_CONFIG,
  POTENTIAL_STOCK_FILTER,
  STRONG_STOCK_FILTER
} from "../config/filters";
import type { StockRow } from "./types";

type PotentialCandidate = {
  stock: StockRow;
  passedConditions: number;
  isStrict: boolean;
  volumeRatio: number;
};

function compareByStrength(left: StockRow, right: StockRow): number {
  const volumeRatioLeft = left.volume / left.averageVolume10d;
  const volumeRatioRight = right.volume / right.averageVolume10d;

  return (
    right.rsAverage3d - left.rsAverage3d ||
    right.roc26 - left.roc26 ||
    volumeRatioRight - volumeRatioLeft ||
    left.ticker.localeCompare(right.ticker)
  );
}

function isFiniteStock(stock: StockRow): boolean {
  return [
    stock.close,
    stock.highAvg4d,
    stock.volume,
    stock.averageVolume10d,
    stock.rsAverage3d,
    stock.roc26,
    stock.ma20,
    stock.ma50,
    stock.ma50Slope5d,
    ...stock.rsLast3
  ].every(Number.isFinite);
}

function isInRange(value: number, minimum: number, maximum: number): boolean {
  return value >= minimum && value <= maximum;
}

function evaluatePotentialStock(
  stock: StockRow,
  vnIndexRoc26: number
): PotentialCandidate | null {
  if (
    !isFiniteStock(stock) ||
    !Number.isFinite(vnIndexRoc26) ||
    stock.volume <= POTENTIAL_STOCK_FILTER.minimumVolume ||
    stock.averageVolume10d <= 0
  ) {
    return null;
  }

  const volumeRatio = stock.volume / stock.averageVolume10d;
  const conditions = [
    stock.volume > POTENTIAL_STOCK_FILTER.minimumVolume,
    stock.rsLast3.every((value) =>
      isInRange(
        value,
        POTENTIAL_STOCK_FILTER.rsMinimum,
        POTENTIAL_STOCK_FILTER.rsMaximum
      )
    ),
    isInRange(
      stock.rsAverage3d,
      POTENTIAL_STOCK_FILTER.rsMinimum,
      POTENTIAL_STOCK_FILTER.rsMaximum
    ),
    stock.roc26 > vnIndexRoc26,
    isInRange(
      stock.roc26,
      POTENTIAL_STOCK_FILTER.roc26Minimum,
      POTENTIAL_STOCK_FILTER.roc26Maximum
    ),
    stock.close > stock.ma20,
    stock.ma20 > stock.ma50,
    stock.ma50Slope5d > 0,
    stock.close > stock.highAvg4d,
    volumeRatio >= POTENTIAL_STOCK_FILTER.minimumVolumeRatio
  ];

  return {
    stock,
    volumeRatio,
    passedConditions: conditions.filter(Boolean).length,
    isStrict: conditions.every(Boolean)
  };
}

export function selectStrongStocks(
  stocks: readonly StockRow[],
  vnIndexRoc26: number
): StockRow[] {
  if (!Number.isFinite(vnIndexRoc26)) {
    return [];
  }

  return stocks
    .filter(
      (stock) =>
        isFiniteStock(stock) &&
        stock.volume > STRONG_STOCK_FILTER.minimumVolume &&
        stock.roc26 > vnIndexRoc26
    )
    .sort(compareByStrength)
    .slice(0, BULLETIN_CONFIG.topLimit);
}

export function selectPotentialStocks(
  stocks: readonly StockRow[],
  vnIndexRoc26: number
): StockRow[] {
  const candidates = stocks
    .map((stock) => evaluatePotentialStock(stock, vnIndexRoc26))
    .filter((candidate): candidate is PotentialCandidate => candidate !== null);
  const strictCandidates = candidates
    .filter((candidate) => candidate.isStrict)
    .sort((left, right) => compareByStrength(left.stock, right.stock));

  if (strictCandidates.length >= BULLETIN_CONFIG.topLimit) {
    return strictCandidates
      .slice(0, BULLETIN_CONFIG.topLimit)
      .map(({ stock }) => stock);
  }

  const nearMisses = candidates
    .filter((candidate) => !candidate.isStrict)
    .sort(
      (left, right) =>
        right.passedConditions - left.passedConditions ||
        compareByStrength(left.stock, right.stock)
    );

  return [...strictCandidates, ...nearMisses]
    .slice(0, BULLETIN_CONFIG.topLimit)
    .map(({ stock }) => stock);
}
