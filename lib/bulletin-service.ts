import { selectPotentialStocks, selectStrongStocks } from "./filters";
import { fetchPublishedCsvRows, PublishedCsvError } from "./published-csv";
import type { BulletinNarrative, BulletinSnapshot, StockRow } from "./types";

type SnapshotRows = { stockRows: unknown[][]; sectorRows: unknown[][]; breadthRows: unknown[][]; vnIndexRows: unknown[][]; narrativeRows?: unknown[][] };

function numeric(value: unknown): number | null { if (typeof value === "number") return Number.isFinite(value) ? value : null; const raw = String(value).trim().replace(/%$/u, ""); const parenthesized = raw.match(/^\((.+)\)$/u); const unsigned = parenthesized ? parenthesized[1] : raw; const normalized = unsigned.includes(",") && !unsigned.includes(".") && /,\d{3}$/u.test(unsigned) ? unsigned.replace(/,/g, "") : unsigned.includes(",") && unsigned.includes(".") ? unsigned.replace(/,/g, "") : unsigned.replace(",", "."); const parsed = Number(normalized); return Number.isFinite(parsed) ? (parenthesized ? -parsed : parsed) : null; }
function headerIndex(headers: unknown[], name: string): number { return headers.findIndex((value) => String(value).trim().toLowerCase() === name.toLowerCase()); }
function normalizedHeader(value: unknown): string { return String(value).trim().toLowerCase().replace(/\s+/gu, " "); }
function stockHeaderIndex(headers: unknown[], name: string): number {
  const exact = headerIndex(headers, name);
  if (exact >= 0) return exact;
  const suffix = ` ${normalizedHeader(name)}`;
  // Google CSV flattens merged group labels into the cell before the semantic column name.
  return headers.findIndex((value) => normalizedHeader(value).endsWith(suffix));
}
function valueAt(row: unknown[], index: number): number | null { return index < 0 ? null : numeric(row[index]); }
function excelDate(value: number): string { return new Date(Date.UTC(1899, 11, 30) + value * 86_400_000).toISOString().slice(0, 10); }
type ParsedSheetDate = { sortValue: number; isoDate: string };

function calendarDate(year: number, month: number, day: number): ParsedSheetDate | null {
  const sortValue = Date.UTC(year, month - 1, day);
  const parsed = new Date(sortValue);
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return null;
  return { sortValue, isoDate: parsed.toISOString().slice(0, 10) };
}

function sheetDateCandidates(value: unknown): ParsedSheetDate[] {
  const numericValue = numeric(value);
  if (numericValue !== null) return [{ sortValue: numericValue, isoDate: excelDate(numericValue) }];
  const match = String(value).trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/u);
  if (!match) return [];

  const first = Number(match[1]);
  const second = Number(match[2]);
  const year = Number(match[3]);
  const candidates = [calendarDate(year, second, first), calendarDate(year, first, second)].filter((date): date is ParsedSheetDate => date !== null);
  return candidates.filter((date, index) => candidates.findIndex((candidate) => candidate.isoDate === date.isoDate) === index);
}

function sheetDate(value: unknown): ParsedSheetDate | null {
  return sheetDateCandidates(value)[0] ?? null;
}

function hasSourceHeaders(rows: unknown[][], expectedHeaderGroups: readonly (readonly string[])[]): boolean {
  return rows.some((row) => expectedHeaderGroups.every((alternatives) => alternatives.some((header) => headerIndex(row, header) >= 0)));
}

function sourceSchemaError(source: string): PublishedCsvError {
  return new PublishedCsvError("SOURCE_SCHEMA_INVALID", source, null, false);
}

function requireSourceHeaders(source: string, rows: unknown[][], expectedHeaderGroups: readonly (readonly string[])[]): void {
  if (!hasSourceHeaders(rows, expectedHeaderGroups)) throw sourceSchemaError(source);
}

function dateSortValue(value: unknown): number {
  return sheetDate(value)?.sortValue ?? Number.NEGATIVE_INFINITY;
}

function parseStocks(rows: unknown[][]): StockRow[] {
  const headerRow = rows.find((row) => stockHeaderIndex(row, "Cổ Phiếu") >= 0) ?? [];
  const ticker = stockHeaderIndex(headerRow, "Cổ Phiếu"); const sector = stockHeaderIndex(headerRow, "Ngành"); const close = stockHeaderIndex(headerRow, "Close"); const high = stockHeaderIndex(headerRow, "High-TB4D"); const volume = stockHeaderIndex(headerRow, "KLGD"); const volume10 = stockHeaderIndex(headerRow, "Vol-TB10D"); const rsAverage = stockHeaderIndex(headerRow, "RS-TB3D"); const roc = stockHeaderIndex(headerRow, "Roc26 (%)"); const ma20 = stockHeaderIndex(headerRow, "MA20"); const ma50 = stockHeaderIndex(headerRow, "MA50"); const slope = stockHeaderIndex(headerRow, "MA50-TB5D");
  const usesGoogleCsvLayout = rsAverage < 0 && headerRow.length >= 10;
  return rows.slice(rows.indexOf(headerRow) + 1).flatMap((row) => {
    if (usesGoogleCsvLayout) {
      const numbers = [2, 3, 4, 5, 7, 8, 9, 10, 11, 13, 14, 16].map((index) => valueAt(row, index));
      if (!String(row[0] ?? "").trim() || numbers.some((value) => value === null)) return [];
      const [closeValue, highValue, volumeValue, volume10Value, rs1, rs2, rs3, rsAverageValue, rocValue, ma20Value, ma50Value, slopeValue] = numbers as number[];
      return [{ ticker: String(row[0]).trim(), sector: String(row[1] ?? ""), close: closeValue, highAvg4d: highValue, volume: volumeValue, averageVolume10d: volume10Value, rsLast3: [rs1, rs2, rs3], rsAverage3d: rsAverageValue, roc26: rocValue, ma20: ma20Value, ma50: ma50Value, ma50Slope5d: slopeValue }];
    }
    const numbers = [valueAt(row, close), valueAt(row, high), valueAt(row, volume), valueAt(row, volume10), valueAt(row, rsAverage), valueAt(row, roc), valueAt(row, ma20), valueAt(row, ma50), valueAt(row, slope), valueAt(row, rsAverage - 1), valueAt(row, rsAverage - 2), valueAt(row, rsAverage - 3)];
    if (!String(row[ticker] ?? "").trim() || numbers.some((value) => value === null)) return [];
    const [closeValue, highValue, volumeValue, volume10Value, rsAverageValue, rocValue, ma20Value, ma50Value, slopeValue, rs3, rs2, rs1] = numbers as number[];
    return [{ ticker: String(row[ticker]).trim(), sector: String(row[sector] ?? ""), close: closeValue, highAvg4d: highValue, volume: volumeValue, averageVolume10d: volume10Value, rsLast3: [rs1, rs2, rs3], rsAverage3d: rsAverageValue, roc26: rocValue, ma20: ma20Value, ma50: ma50Value, ma50Slope5d: slopeValue }];
  });
}

function latestVnIndex(rows: unknown[][], asOfDateHint?: string): { roc: number; asOfDate: string } {
  const headers = rows[0] ?? []; const ticker = headerIndex(headers, "Ticker"); const date = headerIndex(headers, "Date/Time"); const roc = headerIndex(headers, "26D change (%)");
  const matches = rows.slice(1).flatMap((row) => {
    const dateCandidates = sheetDateCandidates(row[date]);
    const dateValue = dateCandidates.find((candidate) => candidate.isoDate === asOfDateHint) ?? dateCandidates[0];
    const rocValue = valueAt(row, roc);
    return String(row[ticker]).toUpperCase() === "VNINDEX" && dateValue !== undefined && rocValue !== null ? [{ date: dateValue, roc: rocValue }] : [];
  });
  if (matches.length === 0) throw new Error("VNINDEX ROC26 is unavailable");
  const latest = matches.sort((left, right) => right.date.sortValue - left.date.sortValue)[0];
  return { roc: latest.roc, asOfDate: latest.date.isoDate };
}

function parseNarrative(rows: unknown[][], asOfDate: string): BulletinNarrative | null {
  const requiredHeaders = ["as_of_date", "status", "conclusion", "action", "footer"];
  const headers = rows.find((row) => requiredHeaders.every((name) => headerIndex(row, name) >= 0));
  if (!headers) return null;

  const date = headerIndex(headers, "as_of_date");
  const status = headerIndex(headers, "status");
  const conclusion = headerIndex(headers, "conclusion");
  const action = headerIndex(headers, "action");
  const footer = headerIndex(headers, "footer");
  const matches = rows.slice(rows.indexOf(headers) + 1).flatMap((row) => {
    const rowDate = sheetDate(row[date]);
    const rowStatus = String(row[status] ?? "").trim().toLowerCase();
    const conclusionText = String(row[conclusion] ?? "").trim();
    const actionText = String(row[action] ?? "").trim();
    if (rowDate?.isoDate !== asOfDate || rowStatus !== "published" || !conclusionText || !actionText) return [];
    return [{ conclusion: conclusionText, action: actionText, footer: String(row[footer] ?? "").trim() }];
  });

  return matches[matches.length - 1] ?? null;
}

export function buildBulletinSnapshot(rows: SnapshotRows): BulletinSnapshot {
  if (!rows.stockRows.some((row) => stockHeaderIndex(row, "Cổ Phiếu") >= 0 && stockHeaderIndex(row, "Ngành") >= 0)) throw sourceSchemaError("Data Clean");
  requireSourceHeaders("Ngành", rows.sectorRows, [["Row Labels", "Ngành"], ["TB Ngành (%)"]]);
  requireSourceHeaders("Đếm MA", rows.breadthRows, [["Row Labels", "Date"], ["CP>MA10"], ["CP>MA20"], ["CP>MA50"], ["CP>MA200"]]);
  requireSourceHeaders("Data_26D", rows.vnIndexRows, [["Ticker"], ["Date/Time"], ["26D change (%)"]]);
  const breadthHeaders = rows.breadthRows[0] ?? []; const rowLabelsDate = headerIndex(breadthHeaders, "Row Labels"); const breadthDate = rowLabelsDate >= 0 ? rowLabelsDate : headerIndex(breadthHeaders, "Date"); const breadthIndexes = ["CP>MA10", "CP>MA20", "CP>MA50", "CP>MA200"].map((name) => headerIndex(breadthHeaders, name));
  const breadth = [...rows.breadthRows.slice(1)].sort((left, right) => dateSortValue(right[breadthDate]) - dateSortValue(left[breadthDate]))[0] ?? [];
  let index: ReturnType<typeof latestVnIndex>;
  try {
    index = latestVnIndex(rows.vnIndexRows, sheetDate(breadth[breadthDate])?.isoDate);
  } catch {
    throw sourceSchemaError("Data_26D");
  }
  const stocks = parseStocks(rows.stockRows);
  if (stocks.length === 0) throw sourceSchemaError("Data Clean");
  const sectorHeaders = rows.sectorRows[0] ?? []; const rowLabelsSector = headerIndex(sectorHeaders, "Row Labels"); const sectorName = rowLabelsSector >= 0 ? rowLabelsSector : headerIndex(sectorHeaders, "Ngành"); const namedSectorPercent = headerIndex(sectorHeaders, "TB Ngành (%)"); const sectorPercent = namedSectorPercent >= 0 ? namedSectorPercent : rowLabelsSector + 1;
  const sectors = rows.sectorRows.slice(1).flatMap((row) => { const value = valueAt(row, sectorPercent); const name = String(row[sectorName] ?? "").trim(); return name && value !== null ? [{ name, averagePercent: value }] : []; }).sort((left, right) => right.averagePercent - left.averagePercent);
  if (sectors.length === 0) throw sourceSchemaError("Ngành");
  const values = breadthIndexes.map((column) => valueAt(breadth, column)); if (values.some((value) => value === null)) throw sourceSchemaError("Đếm MA");
  const narrativeRows = rows.narrativeRows ?? [];
  const narrative = hasSourceHeaders(narrativeRows, [["as_of_date"], ["status"], ["conclusion"], ["action"], ["footer"]])
    ? parseNarrative(narrativeRows, index.asOfDate)
    : null;
  return { asOfDate: index.asOfDate, generatedAt: new Date().toISOString(), vnIndexRoc26: index.roc, sectors, strongStocks: selectStrongStocks(stocks, index.roc), potentialStocks: selectPotentialStocks(stocks, index.roc), marketBreadth: { ma10: values[0]!, ma20: values[1]!, ma50: values[2]!, ma200: values[3]! }, narrative };
}

export async function getBulletinSnapshot(): Promise<BulletinSnapshot> {
  const sourceUrl = process.env.GOOGLE_SHEETS_URL?.trim() ?? "";
  const match = sourceUrl.match(/\/spreadsheets\/d\/([^/]+)/u);
  if (!match) throw new Error("Google Sheets URL is not configured");
  const sheetUrl = (sheet: string) => `https://docs.google.com/spreadsheets/d/${match[1]}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;
  const requiredSources = ["Data Clean", "Ngành", "Đếm MA", "Data_26D"] as const;
  const [stockRows, sectorRows, breadthRows, vnIndexRows, narrativeRows] = await Promise.all([
    ...requiredSources.map((source) => fetchPublishedCsvRows(sheetUrl(source), fetch, { source })),
    fetchPublishedCsvRows(sheetUrl("Web_Bulletin"), fetch, { source: "Web_Bulletin" }).catch(() => []),
  ]);
  return buildBulletinSnapshot({ stockRows, sectorRows, breadthRows, vnIndexRows, narrativeRows });
}
