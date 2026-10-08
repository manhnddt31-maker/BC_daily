import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  HeaderMarketArtwork,
  SpeakerArtwork,
} from "../components/bulletin-artwork";
import { BulletinCanvas } from "../components/bulletin-canvas";
import { NextSessionBuyTable } from "../components/next-session-buy-table";

describe("bulletin vector artwork", () => {
  it("test_next_session_buy_table_renders_populated_rows_as_text", () => {
    const markup = renderToStaticMarkup(createElement(NextSessionBuyTable, {
      rows: [
        { id: "buy-1", ticker: "HCM", buyZone: "145-150" },
        { id: "buy-2", ticker: "<MBB>", buyZone: "28-29" },
      ],
    }));

    expect(markup).toContain("CỔ PHIẾU XUẤT HIỆN ĐIỂM MUA CHO PHIÊN TỚI");
    expect(markup).toContain("MÃ CP");
    expect(markup).toContain("VÙNG THEO DÕI");
    expect(markup).toContain("HCM");
    expect(markup).toContain("&lt;MBB&gt;");
    expect(markup).not.toContain("<MBB>");
  });

  it("test_next_session_buy_table_renders_an_empty_state", () => {
    const markup = renderToStaticMarkup(createElement(NextSessionBuyTable, { rows: [] }));

    expect(markup).toContain("Chưa có dữ liệu");
    expect(markup).not.toContain("<table");
  });

  it("test_header_artwork_has_detailed_deterministic_market_layers", () => {
    // The header carries a detailed globe, candlesticks and an upward trend without raster assets.
    const markup = renderToStaticMarkup(createElement(HeaderMarketArtwork));

    expect(markup).toContain('data-artwork="header-market"');
    expect(markup).toContain('data-artwork-part="globe"');
    expect(markup.match(/data-candlestick="true"/gu)?.length).toBeGreaterThanOrEqual(24);
    expect(markup.match(/data-candlestick-wick="true"/gu)?.length).toBeGreaterThanOrEqual(24);
    expect(markup).toContain('marker-end="url(#cnf-header-trend-arrow)"');
    expect(markup).toContain("var(--color-art-primary)");
    expect(markup.toLowerCase()).not.toContain("#1e68ff");
  });

  it("test_decorative_artwork_stays_out_of_the_accessibility_tree", () => {
    // Decorative visuals never duplicate the bulletin's textual information for screen readers.
    const headerMarkup = renderToStaticMarkup(createElement(HeaderMarketArtwork));
    const speakerMarkup = renderToStaticMarkup(createElement(SpeakerArtwork));

    for (const markup of [headerMarkup, speakerMarkup]) {
      expect(markup).toContain('aria-hidden="true"');
      expect(markup).toContain('focusable="false"');
    }
    expect(speakerMarkup).toContain('data-artwork="speaker"');
  });

  it("test_bulletin_canvas_replaces_footer_artwork_with_the_buy_table", () => {
    const markup = renderToStaticMarkup(createElement(BulletinCanvas, {
      snapshot: null,
      nextSessionBuys: [{ id: "buy-1", ticker: "HCM", buyZone: "145-150" }],
    }));

    expect(markup).toContain('data-artwork="header-market"');
    expect(markup).toContain("CỔ PHIẾU XUẤT HIỆN ĐIỂM MUA CHO PHIÊN TỚI");
    expect(markup).toContain("145-150");
    expect(markup).not.toContain('data-artwork="footer-financial"');
    expect(markup).toContain('data-artwork="speaker"');
    expect(markup).not.toContain('class="speaker-icon"');
  });
});
