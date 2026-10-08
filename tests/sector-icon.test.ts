import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getSectorIconKey, SectorIcon } from "../components/sector-icon";
import { SectorRanking } from "../components/sector-ranking";

const knownSectors = [
  "Khoang san",
  "Dau khi",
  "Cao su",
  "Ban le",
  "Thuc pham - Do uong",
  "Bao hiem",
  "Van tai - Cang bien",
  "Y te - Duoc pham",
  "Nhua",
  "Hang khong",
  "Vat lieu xay dung",
  "Hoa chat - Phan bon",
  "BDS Khu cong nghiep",
  "Ngan hang",
  "Cong nghe",
  "Dau tu cong",
  "Dien - Nang luong",
  "Thep",
  "Bat dong san",
  "Thuy san",
  "Det may",
  "Chung khoan",
] as const;

describe("SectorIcon", () => {
  it("test_known_sector_names_map_to_22_distinct_icons", () => {
    // The complete bulletin ranking gives every known sector its own visual identity.
    const iconKeys = knownSectors.map(getSectorIconKey);

    expect(new Set(iconKeys).size).toBe(22);
    expect(iconKeys).not.toContain("market");
  });

  it("test_sector_name_normalization_supports_vietnamese_variants", () => {
    // Accents, case and surrounding whitespace do not change the selected icon.
    const normalizedKey = getSectorIconKey("  KHOÁNG SẢN  ");

    expect(normalizedKey).toBe(getSectorIconKey("Khoang san"));
  });

  it("test_unknown_sector_uses_accessible_decorative_fallback", () => {
    // Unknown sectors keep a safe generic icon without duplicating the adjacent text label.
    const markup = renderToStaticMarkup(createElement(SectorIcon, { sectorName: "Ngành mới" }));

    expect(markup).toContain('data-sector-icon="market"');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('focusable="false"');
  });

  it("test_sector_ranking_renders_sector_specific_icons", () => {
    // The visible ranking uses each sector's code-native icon instead of the legacy repeated glyph.
    const markup = renderToStaticMarkup(createElement(SectorRanking, {
      sectors: [
        { name: "Khoang san", averagePercent: 1.25 },
        { name: "Ngan hang", averagePercent: -0.75 },
      ],
    }));

    expect(markup).toContain('data-sector-icon="mining"');
    expect(markup).toContain('data-sector-icon="bank"');
    expect(markup).not.toContain("<i");
  });
});
