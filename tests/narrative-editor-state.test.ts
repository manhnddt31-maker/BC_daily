import { describe, expect, it } from "vitest";
import {
  createNarrativeDraftPayload,
  createNarrativeEditorState,
  DEFAULT_BULLETIN_NARRATIVE,
  narrativeEditorReducer,
  readNarrativeDraft,
  removeNarrativeDraft,
  resolvePreviewNarrative,
  resolveSourceNarrative,
  validateNextSessionBuys,
  writeNarrativeDraft,
} from "../lib/narrative-editor-state";
import type { BulletinNarrative } from "../lib/types";

const sourceNarrative: BulletinNarrative = {
  conclusion: "Nội dung nguồn",
  action: "Hành động nguồn",
  footer: "Nhận định nguồn",
};

describe("narrative editor state", () => {
  it("test_source_narrative_initializes_an_empty_next_session_buy_list", () => {
    const state = createNarrativeEditorState("2026-08-11", sourceNarrative, null);

    expect(state.draft).toEqual({
      ...sourceNarrative,
      nextSessionBuys: [],
    });
  });

  it("test_add_buy_appends_a_row_and_marks_the_draft_unrendered", () => {
    const initial = createNarrativeEditorState("2026-08-11", sourceNarrative, null);

    const state = narrativeEditorReducer(initial, {
      type: "add-buy",
      row: { id: "buy-1", ticker: "", buyZone: "" },
    });

    expect(state.draft.nextSessionBuys).toEqual([
      { id: "buy-1", ticker: "", buyZone: "" },
    ]);
    expect(state.hasUnrenderedChanges).toBe(true);
  });

  it("test_add_buy_ignores_rows_after_the_fourth_entry", () => {
    let state = createNarrativeEditorState("2026-08-11", sourceNarrative, null);
    for (let index = 1; index <= 5; index += 1) {
      state = narrativeEditorReducer(state, {
        type: "add-buy",
        row: { id: `buy-${index}`, ticker: `CP${index}`, buyZone: `${index}0-${index}1` },
      });
    }

    expect(state.draft.nextSessionBuys.map((row) => row.id)).toEqual([
      "buy-1",
      "buy-2",
      "buy-3",
      "buy-4",
    ]);
  });

  it("test_edit_buy_uppercases_the_ticker_for_the_matching_row", () => {
    const initial = createNarrativeEditorState("2026-08-11", sourceNarrative, {
      ...sourceNarrative,
      nextSessionBuys: [{ id: "buy-1", ticker: "", buyZone: "145-150" }],
    });

    const state = narrativeEditorReducer(initial, {
      type: "edit-buy",
      id: "buy-1",
      field: "ticker",
      value: "  hcm ",
    });

    expect(state.draft.nextSessionBuys[0]).toEqual({
      id: "buy-1",
      ticker: "  HCM ",
      buyZone: "145-150",
    });
  });

  it("test_remove_buy_deletes_only_the_matching_row", () => {
    const initial = createNarrativeEditorState("2026-08-11", sourceNarrative, {
      ...sourceNarrative,
      nextSessionBuys: [
        { id: "buy-1", ticker: "HCM", buyZone: "145-150" },
        { id: "buy-2", ticker: "MBB", buyZone: "28-29" },
      ],
    });

    const state = narrativeEditorReducer(initial, { type: "remove-buy", id: "buy-1" });

    expect(state.draft.nextSessionBuys).toEqual([
      { id: "buy-2", ticker: "MBB", buyZone: "28-29" },
    ]);
  });

  it("test_validation_rejects_a_row_with_one_missing_field", () => {
    const errors = validateNextSessionBuys([
      { id: "buy-1", ticker: "HCM", buyZone: "   " },
    ]);

    expect(errors).toEqual([
      { rowId: "buy-1", field: "buyZone", message: "Vui lòng nhập vùng theo dõi." },
    ]);
  });

  it("test_validation_rejects_the_later_duplicate_ticker_after_normalization", () => {
    const errors = validateNextSessionBuys([
      { id: "buy-1", ticker: "HCM", buyZone: "145-150" },
      { id: "buy-2", ticker: " hcm ", buyZone: "151-153" },
    ]);

    expect(errors).toEqual([
      { rowId: "buy-2", field: "ticker", message: "Mã cổ phiếu đã xuất hiện." },
    ]);
  });

  it("test_new_draft_payload_uses_version_two_and_includes_the_buy_list", () => {
    const payload = createNarrativeDraftPayload("2026-08-11", {
      ...sourceNarrative,
      nextSessionBuys: [{ id: "buy-1", ticker: "HCM", buyZone: "145-150" }],
    });

    expect(payload).toMatchObject({
      version: 2,
      narrative: {
        nextSessionBuys: [{ id: "buy-1", ticker: "HCM", buyZone: "145-150" }],
      },
    });
  });

  it("test_read_migrates_a_valid_version_one_payload_in_memory", () => {
    const legacyPayload = {
      version: 1,
      asOfDate: "2026-08-11",
      narrative: sourceNarrative,
      savedAt: "2026-08-11T07:00:00.000Z",
    };

    const result = readNarrativeDraft(
      { getItem: () => JSON.stringify(legacyPayload) },
      "2026-08-11",
    );

    expect(result).toEqual({
      ok: true,
      value: {
        ...legacyPayload,
        version: 2,
        narrative: { ...sourceNarrative, nextSessionBuys: [] },
      },
    });
  });

  it("test_version_one_migration_discards_unexpected_buy_rows", () => {
    const legacyPayload = {
      version: 1,
      asOfDate: "2026-08-11",
      narrative: {
        ...sourceNarrative,
        nextSessionBuys: Array.from({ length: 5 }, (_, index) => ({
          id: `legacy-${index}`,
          ticker: `CP${index}`,
          buyZone: "10-11",
        })),
      },
      savedAt: "2026-08-11T07:00:00.000Z",
    };

    const result = readNarrativeDraft(
      { getItem: () => JSON.stringify(legacyPayload) },
      "2026-08-11",
    );

    expect(result).toMatchObject({
      ok: true,
      value: { narrative: { nextSessionBuys: [] } },
    });
  });

  it("test_render_trims_buy_rows_before_copying_them_to_preview", () => {
    const initial = createNarrativeEditorState("2026-08-11", sourceNarrative, {
      ...sourceNarrative,
      nextSessionBuys: [{ id: "buy-1", ticker: " HCM ", buyZone: " 145-150 " }],
    });

    const state = narrativeEditorReducer(initial, { type: "render" });

    expect(state.rendered.nextSessionBuys).toEqual([
      { id: "buy-1", ticker: "HCM", buyZone: "145-150" },
    ]);
    expect(state.draft).toEqual(state.rendered);
  });

  it("test_initializes_saved_draft_without_rendering_it", () => {
    // A saved draft is editable on load, while preview remains on the source until Render.
    const savedDraft: BulletinNarrative = {
      conclusion: "Kết luận nháp",
      action: "Hành động nháp",
      footer: "Nhận định nháp",
    };

    const state = createNarrativeEditorState("2026-08-11", sourceNarrative, savedDraft);

    expect(state).toMatchObject({
      asOfDate: "2026-08-11",
      source: sourceNarrative,
      draft: savedDraft,
      rendered: sourceNarrative,
      hasUnrenderedChanges: true,
    });
  });

  it("test_edit_updates_draft_without_changing_rendered_narrative", () => {
    // Typing changes only the draft until the user explicitly renders it.
    const initial = createNarrativeEditorState("2026-08-11", sourceNarrative, null);

    const state = narrativeEditorReducer(initial, {
      type: "edit",
      field: "conclusion",
      value: "Kết luận vừa nhập",
    });

    expect(state).toMatchObject({
      draft: { ...sourceNarrative, conclusion: "Kết luận vừa nhập" },
      rendered: sourceNarrative,
      hasUnrenderedChanges: true,
    });
  });

  it("test_render_copies_all_draft_fields_to_preview", () => {
    // Render applies the complete draft atomically instead of one field at a time.
    const savedDraft: BulletinNarrative = {
      conclusion: "Kết luận mới",
      action: "Hành động mới",
      footer: "Nhận định mới",
    };
    const initial = createNarrativeEditorState("2026-08-11", sourceNarrative, savedDraft);

    const state = narrativeEditorReducer(initial, { type: "render" });

    expect(state).toMatchObject({
      draft: savedDraft,
      rendered: savedDraft,
      hasUnrenderedChanges: false,
    });
  });

  it("test_reset_restores_source_for_draft_and_preview", () => {
    // Reset discards the local editing state and returns both surfaces to source.
    const savedDraft: BulletinNarrative = {
      conclusion: "Kết luận nháp",
      action: "Hành động nháp",
      footer: "Nhận định nháp",
    };
    const initial = createNarrativeEditorState("2026-08-11", sourceNarrative, savedDraft);

    const state = narrativeEditorReducer(initial, { type: "reset" });

    expect(state).toMatchObject({
      draft: sourceNarrative,
      rendered: sourceNarrative,
      hasUnrenderedChanges: false,
    });
  });

  it("test_storage_round_trip_is_partitioned_by_bulletin_date", () => {
    // A saved payload is only returned for the exact bulletin date in its key.
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    };
    const payload = createNarrativeDraftPayload("2026-08-11", sourceNarrative, "2026-08-11T07:00:00.000Z");

    const writeResult = writeNarrativeDraft(storage, payload);
    const currentDate = readNarrativeDraft(storage, "2026-08-11");
    const nextDate = readNarrativeDraft(storage, "2026-08-12");

    expect({ writeResult, currentDate, nextDate }).toEqual({
      writeResult: { ok: true, value: payload },
      currentDate: { ok: true, value: payload },
      nextDate: { ok: true, value: null },
    });
  });

  it("test_storage_exceptions_return_recoverable_results", () => {
    // Browser storage failures must not throw and block in-memory editing.
    const storage = {
      getItem: () => { throw new DOMException("blocked", "SecurityError"); },
      setItem: () => { throw new DOMException("full", "QuotaExceededError"); },
      removeItem: () => { throw new DOMException("blocked", "SecurityError"); },
    };
    const payload = createNarrativeDraftPayload("2026-08-11", sourceNarrative);

    const results = {
      read: readNarrativeDraft(storage, "2026-08-11"),
      write: writeNarrativeDraft(storage, payload),
      remove: removeNarrativeDraft(storage, "2026-08-11"),
    };

    expect(results).toMatchObject({
      read: { ok: false, value: null },
      write: { ok: false, value: payload },
      remove: { ok: false, value: null },
    });
  });

  it("test_invalid_or_wrong_date_payload_is_ignored", () => {
    // Corrupt and cross-date payloads fall back instead of entering editor state.
    const malformed = readNarrativeDraft({ getItem: () => "{not-json" }, "2026-08-11");
    const wrongDatePayload = createNarrativeDraftPayload("2026-08-10", sourceNarrative);
    const wrongDate = readNarrativeDraft(
      { getItem: () => JSON.stringify(wrongDatePayload) },
      "2026-08-11",
    );

    expect({ malformed, wrongDate }).toMatchObject({
      malformed: { ok: false, value: null },
      wrongDate: { ok: false, value: null },
    });
  });

  it("test_loading_new_date_cannot_reuse_previous_draft_or_rendered_text", () => {
    // A new market date fully replaces date-scoped local state.
    const oldDraft: BulletinNarrative = {
      conclusion: "Kết luận ngày cũ",
      action: "Hành động ngày cũ",
      footer: "Nhận định ngày cũ",
    };
    const initial = narrativeEditorReducer(
      createNarrativeEditorState("2026-08-11", sourceNarrative, oldDraft),
      { type: "render" },
    );
    const nextSource: BulletinNarrative = {
      conclusion: "Kết luận nguồn ngày mới",
      action: "Hành động nguồn ngày mới",
      footer: "Nhận định nguồn ngày mới",
    };

    const state = narrativeEditorReducer(initial, {
      type: "load",
      asOfDate: "2026-08-12",
      source: nextSource,
      savedDraft: null,
    });

    expect(state).toEqual(createNarrativeEditorState("2026-08-12", nextSource, null));
  });

  it("test_same_date_refresh_preserves_local_draft_and_rendered_override", () => {
    // Quantitative polling on the same date must not erase local editorial work.
    const edited = narrativeEditorReducer(
      createNarrativeEditorState("2026-08-11", sourceNarrative, null),
      { type: "edit", field: "action", value: "Hành động đang soạn" },
    );
    const rendered = narrativeEditorReducer(edited, { type: "render" });
    const refreshedSource = { ...sourceNarrative, conclusion: "Nguồn vừa cập nhật" };

    const state = narrativeEditorReducer(rendered, {
      type: "refresh-source",
      asOfDate: "2026-08-11",
      source: refreshedSource,
    });

    expect(state).toMatchObject({
      source: refreshedSource,
      draft: rendered.draft,
      rendered: rendered.rendered,
      hasUnrenderedChanges: false,
    });
  });

  it("test_same_date_refresh_updates_source_when_there_is_no_local_work", () => {
    // Without a draft or rendered override, source narrative should keep following the API.
    const initial = createNarrativeEditorState("2026-08-11", sourceNarrative, null);
    const refreshedSource = { ...sourceNarrative, conclusion: "Nguồn vừa cập nhật" };

    const state = narrativeEditorReducer(initial, {
      type: "refresh-source",
      asOfDate: "2026-08-11",
      source: refreshedSource,
    });

    expect(state).toMatchObject({
      source: refreshedSource,
      draft: refreshedSource,
      rendered: refreshedSource,
      hasUnrenderedChanges: false,
    });
  });

  it("test_missing_source_uses_shared_bulletin_fallback", () => {
    // Editor, reset, and canvas must resolve a missing source to one shared value.
    const resolved = resolveSourceNarrative(null);

    expect(resolved).toEqual(DEFAULT_BULLETIN_NARRATIVE);
  });

  it("test_preview_rejects_rendered_override_from_another_date", () => {
    // A state transition effect may lag one render, so preview must also guard by date.
    const oldState = narrativeEditorReducer(
      createNarrativeEditorState("2026-08-11", sourceNarrative, {
        conclusion: "Nháp cũ",
        action: "Hành động cũ",
        footer: "Nhận định cũ",
      }),
      { type: "render" },
    );
    const nextSource = { ...sourceNarrative, conclusion: "Nguồn ngày mới" };

    const preview = resolvePreviewNarrative(oldState, "2026-08-12", nextSource);

    expect(preview).toEqual({ ...nextSource, nextSessionBuys: [] });
  });
});
