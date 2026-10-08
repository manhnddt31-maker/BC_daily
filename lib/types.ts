export type StockRow = {
  ticker: string;
  sector: string;
  close: number;
  highAvg4d: number;
  volume: number;
  averageVolume10d: number;
  rsLast3: readonly [number, number, number];
  rsAverage3d: number;
  roc26: number;
  ma20: number;
  ma50: number;
  ma50Slope5d: number;
};

export type SectorStrength = {
  name: string;
  averagePercent: number;
};

export type MarketBreadth = {
  ma10: number;
  ma20: number;
  ma50: number;
  ma200: number;
};

export type BulletinNarrative = {
  conclusion: string;
  action: string;
  footer: string;
};

export type NextSessionBuy = {
  id: string;
  ticker: string;
  buyZone: string;
};

export type BulletinEditorContent = BulletinNarrative & {
  nextSessionBuys: NextSessionBuy[];
};

export type BulletinSnapshot = {
  asOfDate: string;
  generatedAt: string;
  vnIndexRoc26: number;
  sectors: SectorStrength[];
  strongStocks: StockRow[];
  potentialStocks: StockRow[];
  marketBreadth: MarketBreadth;
  narrative: BulletinNarrative | null;
  dataStatus?: {
    source: "vnstock";
    stale: boolean;
    lastAttemptAt: string;
    warning: string | null;
  };
};

export type SheetRows = ReadonlyArray<ReadonlyArray<string>>;
