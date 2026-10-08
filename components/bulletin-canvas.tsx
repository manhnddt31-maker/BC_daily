import Image from "next/image";
import { MarketBreadth } from "./market-breadth";
import { NarrativePanel } from "./narrative-panel";
import { SectorRanking } from "./sector-ranking";
import { StockTable } from "./stock-table";
import type { BulletinSnapshot, NextSessionBuy } from "../lib/types";
import { DEFAULT_BULLETIN_NARRATIVE } from "../lib/narrative-editor-state";
import { HeaderMarketArtwork, SpeakerArtwork } from "./bulletin-artwork";
import { NextSessionBuyTable } from "./next-session-buy-table";

function formatBulletinDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return value;
  const date = new Date(`${value}T00:00:00Z`);
  const weekday = new Intl.DateTimeFormat("vi-VN", { weekday: "long", timeZone: "UTC" }).format(date);
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ngày ${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}`;
}

export function BulletinCanvas({
  snapshot,
  displayDate,
  nextSessionBuys = [],
}: {
  snapshot: BulletinSnapshot | null;
  displayDate?: string;
  nextSessionBuys?: readonly NextSessionBuy[];
}) {
  const dateValue = displayDate || snapshot?.asOfDate;
  const asOfDate = dateValue ? formatBulletinDate(dateValue) : "Chờ dữ liệu";
  const footer = snapshot?.narrative?.footer ?? DEFAULT_BULLETIN_NARRATIVE.footer;
  return <article className="bulletin-canvas" id="bulletin-canvas" aria-busy={!snapshot}><header className="bulletin-header"><div className="brand-wrap"><div className="logo-frame"><Image className="bulletin-logo" src="/assets/cnf-logo.png" alt="CNF Fundamental Growth" width={278} height={124} priority /></div><div className="headline-wrap"><h1 className="bulletin-title">BẢN TIN SÁNG</h1><p className="bulletin-subtitle">CẬP NHẬT THỊ TRƯỜNG CHỨNG KHOÁN</p><p className="date-badge"><span aria-hidden="true">▦</span>{asOfDate}</p></div></div><HeaderMarketArtwork /></header><div className="bulletin-grid"><SectorRanking sectors={snapshot?.sectors ?? []} /><div className="bulletin-column middle"><StockTable title="TOP CỔ PHIẾU DẪN DẮT THEO CHỈ SỐ RS" stocks={snapshot?.strongStocks ?? []} variant="leaders" /><MarketBreadth breadth={snapshot?.marketBreadth ?? null} /></div><div className="bulletin-column right"><StockTable title="TOP CỔ PHIẾU TIỀM NĂNG" stocks={snapshot?.potentialStocks ?? []} variant="recovery" /><NarrativePanel narrative={snapshot?.narrative ?? null} /></div></div><footer className="bulletin-footer"><div className="footer-label"><SpeakerArtwork /><strong>NHẬN ĐỊNH THỊ TRƯỜNG</strong></div><p>{footer}</p><NextSessionBuyTable rows={nextSessionBuys} /></footer></article>;
}
