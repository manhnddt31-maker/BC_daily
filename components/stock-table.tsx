import type { StockRow } from "../lib/types";

function RisingArrow() {
  return <svg className="rising-arrow" viewBox="0 0 120 70" preserveAspectRatio="none" aria-hidden="true"><polyline points="5,58 25,40 42,49 62,28 78,38 108,10" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /><polygon points="108,10 94,12 105,22" fill="currentColor" /></svg>;
}

export function StockTable({ title, stocks, variant }: { title: string; stocks: StockRow[]; variant: "leaders" | "recovery" }) {
  return <section className={`panel stock-panel ${variant}`}><h2>{title}</h2>{stocks.length === 0 ? <div className="empty-panel">Chưa có mã phù hợp.</div> : variant === "leaders" ? <div className="rs-grid">{stocks.map((stock, index) => <div className="rs-item" key={stock.ticker}><span className="rank-badge">{index + 1}</span><span className="ticker-circle">{stock.ticker}</span></div>)}</div> : <div className="recovery-grid">{stocks.map((stock) => <div className="recovery-card" key={stock.ticker}><strong>{stock.ticker}</strong><RisingArrow /></div>)}</div>}</section>;
}
