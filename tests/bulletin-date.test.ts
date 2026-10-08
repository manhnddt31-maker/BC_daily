import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BulletinCanvas } from "../components/bulletin-canvas";
import {
  bulletinDateEditorReducer,
  createBulletinDateDraft,
  readBulletinDateDraft,
  resolveBulletinDisplayDate,
  writeBulletinDateDraft,
} from "../lib/bulletin-date";
import type { BulletinSnapshot } from "../lib/types";

const snapshot: BulletinSnapshot = {
  asOfDate: "2026-07-06",
  generatedAt: "2026-08-11T07:43:07.602Z",
  vnIndexRoc26: -1.07,
  sectors: [],
  strongStocks: [],
  potentialStocks: [],
  marketBreadth: { ma10: 0, ma20: 0, ma50: 0, ma200: 0 },
  narrative: null,
};

describe("bulletin display date", () => {
  it("test_manual_date_only_changes_preview_after_render_and_reset_restores_fallback", () => {
    const loaded = bulletinDateEditorReducer(
      { sourceDate: "", draft: "", rendered: "" },
      { type: "load", sourceDate: "2026-08-11", draft: "2026-08-15", rendered: "2026-08-12" },
    );
    const edited = bulletinDateEditorReducer(loaded, { type: "edit", value: "2026-08-16" });

    expect(edited.draft).toBe("2026-08-16");
    expect(edited.rendered).toBe("2026-08-12");

    const rendered = bulletinDateEditorReducer(edited, { type: "render" });
    expect(rendered.rendered).toBe("2026-08-16");

    const reset = bulletinDateEditorReducer(rendered, { type: "reset", value: "2026-08-12" });
    expect(reset).toEqual({ sourceDate: "2026-08-11", draft: "2026-08-12", rendered: "2026-08-12" });
  });

  it("test_manual_date_draft_round_trips_per_source_date", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    };
    const payload = createBulletinDateDraft("2026-08-11", "2026-08-15", "2026-08-12T01:00:00.000Z");

    const writeResult = writeBulletinDateDraft(storage, payload);
    const readResult = readBulletinDateDraft(storage, "2026-08-11");

    expect(writeResult.ok).toBe(true);
    expect(readResult).toEqual({ ok: true, value: payload });
    expect(readBulletinDateDraft(storage, "2026-08-12")).toEqual({ ok: true, value: null });
  });

  it("test_visible_date_prefers_computer_date_over_market_data_date", () => {
    // Every visible bulletin date follows the computer while source data keeps its own date.
    const displayDate = resolveBulletinDisplayDate("2026-08-11", snapshot.asOfDate);

    expect(displayDate).toBe("2026-08-11");
  });

  it("test_header_uses_computer_date_instead_of_market_data_date", () => {
    // The publication date follows the browser computer, while source data keeps its own date.
    const props = {
      snapshot,
      displayDate: "2026-08-11",
    } as Parameters<typeof BulletinCanvas>[0] & { displayDate: string };

    const markup = renderToStaticMarkup(createElement(BulletinCanvas, props));

    expect(markup).toContain("Thứ Ba, ngày 11/08/2026");
    expect(markup).not.toContain("Thứ Hai, ngày 06/07/2026");
  });
});
