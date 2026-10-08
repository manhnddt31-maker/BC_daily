import type { ReactNode } from "react";

const sectorIconKeys = [
  "mining",
  "oil",
  "rubber",
  "retail",
  "food",
  "insurance",
  "port",
  "healthcare",
  "plastic",
  "aviation",
  "materials",
  "chemicals",
  "industrial",
  "bank",
  "technology",
  "infrastructure",
  "energy",
  "steel",
  "real-estate",
  "seafood",
  "textile",
  "stocks",
  "market",
] as const;

export type SectorIconKey = (typeof sectorIconKeys)[number];

const sectorIconByName: Readonly<Record<string, SectorIconKey>> = {
  "khoang san": "mining",
  "dau khi": "oil",
  "cao su": "rubber",
  "ban le": "retail",
  "thuc pham - do uong": "food",
  "bao hiem": "insurance",
  "van tai - cang bien": "port",
  "y te - duoc pham": "healthcare",
  nhua: "plastic",
  "hang khong": "aviation",
  "vat lieu xay dung": "materials",
  "hoa chat - phan bon": "chemicals",
  "bds khu cong nghiep": "industrial",
  "bat dong san khu cong nghiep": "industrial",
  "ngan hang": "bank",
  "cong nghe": "technology",
  "dau tu cong": "infrastructure",
  "dien - nang luong": "energy",
  thep: "steel",
  "bat dong san": "real-estate",
  "thuy san": "seafood",
  "det may": "textile",
  "chung khoan": "stocks",
};

export function normalizeSectorName(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("vi-VN")
    .replace(/đ/gu, "d")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[–—]/gu, "-")
    .replace(/\s*-\s*/gu, " - ")
    .replace(/\s+/gu, " ");
}

export function getSectorIconKey(sectorName: string): SectorIconKey {
  return sectorIconByName[normalizeSectorName(sectorName)] ?? "market";
}

function IconPaths({ iconKey }: { iconKey: SectorIconKey }): ReactNode {
  switch (iconKey) {
    case "mining":
      return <><path d="M4 17 9 8l4 9H4Z" /><path d="m12 7 8 3M16 5l-3 13M18 6l2 2" /><path d="m7 17 2-3 2 3" /></>;
    case "oil":
      return <><path d="M8 20h8L13 4h-2L8 20Z" /><path d="M9 15h6M10 10h4M7 20h10" /><path d="m6 8 5-3m7 3-5-3" /></>;
    case "rubber":
      return <><path d="M12 21V10M8 21h8" /><path d="M12 10C7 10 5 7 6 4c3 0 5 1 6 4 1-3 3-4 6-4 1 3-1 6-6 6Z" /><path d="M15 13c2 2 2 4 0 5-2-1-2-3 0-5Z" /></>;
    case "retail":
      return <><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /><path d="M9 13h6" /></>;
    case "food":
      return <><path d="M6 4h8l-1 8H7L6 4Z" /><path d="M8 12v7m4-7v7M5 20h10" /><path d="M16 6c3-2 5 0 3 3-2 2-4 1-4 1" /></>;
    case "insurance":
      return <><path d="M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>;
    case "port":
      return <><path d="M3 17h18l-3 3H7l-4-3Z" /><path d="M6 17V9h11v8M9 9V5h5v4" /><path d="M3 13h3m11 0h4M5 22c2-1 3-1 5 0 2-1 3-1 5 0 2-1 3-1 5 0" /></>;
    case "healthcare":
      return <><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z" /></>;
    case "plastic":
      return <><path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11Z" /><circle cx="10" cy="14" r="1" /><circle cx="14.5" cy="11.5" r="1" /><path d="m11 18 4-2" /></>;
    case "aviation":
      return <><path d="m3 13 8-2 3-7 2 1-2 6 6 2v2l-7-1-4 6-2-1 3-6-7 2v-2Z" /></>;
    case "materials":
      return <><path d="M4 5h7v5H4V5Zm9 0h7v5h-7V5ZM7 12h7v5H7v-5Zm-3 7h7v2H4v-2Zm9 0h7v2h-7v-2Z" /></>;
    case "chemicals":
      return <><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" /><path d="M7 16h10M9 13h6" /><circle cx="11" cy="18.5" r=".7" /></>;
    case "industrial":
      return <><path d="M3 21V10l6 3V9l6 4V6h4v15H3Z" /><path d="M6 17h2m3 0h2m3 0h2M16 9h3" /></>;
    case "bank":
      return <><path d="m3 9 9-6 9 6H3Zm2 2h14M6 11v7m4-7v7m4-7v7m4-7v7M3 20h18" /></>;
    case "technology":
      return <><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 9h6v6H9V9ZM9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4" /></>;
    case "infrastructure":
      return <><path d="M3 19h18M5 19v-7m14 7v-7M5 12c4-6 10-6 14 0" /><path d="M8 12v3m4-6v6m4-3v3" /></>;
    case "energy":
      return <><path d="m13 2-7 12h6l-1 8 7-12h-6l1-8Z" /><circle cx="12" cy="12" r="9" opacity=".35" /></>;
    case "steel":
      return <><path d="M5 4h14v4h-5v8h5v4H5v-4h5V8H5V4Z" /><path d="M7 6h10M7 18h10" /></>;
    case "real-estate":
      return <><path d="M4 21V8h7v13M13 21V3h7v18M2 21h20" /><path d="M7 11h1m-1 4h1m8-8h1m-1 4h1m-1 4h1" /></>;
    case "seafood":
      return <><path d="M4 13c4-5 9-5 14 0-5 5-10 5-14 0Z" /><path d="m18 13 3-3v6l-3-3ZM8 13h.01M3 20c2-1 3-1 5 0 2-1 3-1 5 0 2-1 3-1 5 0" /></>;
    case "textile":
      return <><circle cx="10" cy="12" r="7" /><circle cx="10" cy="12" r="3" /><path d="M15 17h5v4h-8m8-4-3-4" /><path d="M7 9c2 1 4 1 6 0M7 15c2-1 4-1 6 0" /></>;
    case "stocks":
      return <><path d="M4 20V4M4 20h17" /><path d="m6 16 4-5 4 3 6-8" /><path d="M16 6h4v4" /><circle cx="10" cy="11" r="1" /><circle cx="14" cy="14" r="1" /></>;
    case "market":
      return <><path d="M4 20V5m0 15h17" /><rect x="7" y="13" width="2" height="5" /><rect x="11" y="9" width="2" height="9" /><rect x="15" y="11" width="2" height="7" /><path d="m7 9 4-3 4 2 5-5" /></>;
  }
}

export function SectorIcon({ sectorName }: { sectorName: string }) {
  const iconKey = getSectorIconKey(sectorName);
  return (
    <svg
      className="sector-icon"
      viewBox="0 0 24 24"
      data-sector-icon={iconKey}
      aria-hidden="true"
      focusable="false"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      >
        <IconPaths iconKey={iconKey} />
      </g>
    </svg>
  );
}
