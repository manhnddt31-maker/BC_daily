import type { SectorStrength } from "../lib/types";
import { SectorIcon } from "./sector-icon";

export function SectorRanking({ sectors }: { sectors: SectorStrength[] }) {
  const values = sectors.map((sector) => sector.averagePercent);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  return <section className="panel sector-panel"><h2>BẢNG XẾP HẠNG NGÀNH THEO SỨC MẠNH GIÁ</h2><div className="sector-head"><span>Ngành</span><span>TB (%)</span></div>{sectors.length === 0 ? <div className="empty-panel">Chưa có dữ liệu ngành.</div> : <div className="sector-list" style={{ gridTemplateRows: `repeat(${sectors.length}, minmax(0, 1fr))` }}>{sectors.map((sector, index) => { const strength = (sector.averagePercent - minimum) / (maximum - minimum || 1); const hue = strength < 0.6 ? 7 + strength * 77 : 53 + (strength - 0.6) * 167; return <div className="sector-row" key={sector.name}><span className="sector-rank">{index + 1}</span><span className="sector-name"><SectorIcon sectorName={sector.name} />{sector.name}</span><strong className="sector-value" style={{ backgroundColor: `hsl(${hue} 92% 39%)` }}>{sector.averagePercent.toFixed(2)}</strong></div>; })}</div>}</section>;
}
