export const SHEET_MAPPING = {
  stocks: {
    range: "'Data Clean'!A:Q",
    headers: {
      ticker: ["Mã", "Ticker", "Code", "Cổ Phiếu"],
      sector: ["Ngành", "Nganh"],
      close: ["Close"],
      highAvg4d: ["High - TB4D", "High-TB4D"],
      volume: ["KLGD", "Volume"],
      averageVolume10d: ["Vol-TB10D", "KLGD-TB10D"],
      rsAverage3d: ["RS-TB3D"],
      roc26: ["ROC26", "ROC 26", "Roc26 (%)"],
      ma20: ["MA20"],
      ma50: ["MA50"],
      ma50Slope5d: ["MA50-TB5D"]
    }
  },
  sectors: {
    range: "'Ngành'!A:C"
  },
  marketBreadth: {
    range: "'Đếm MA'!A:E"
  },
  narrative: {
    range: "'Web_Bulletin'!A:E"
  },
  vnIndexRoc26: {
    range: "'Data_26D'!A:G"
  }
} as const;
