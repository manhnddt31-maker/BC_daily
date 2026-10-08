"use client";

import { toPng } from "html-to-image";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { BULLETIN_CONFIG } from "../config/filters";
import {
  bulletinDateEditorReducer,
  createBulletinDateDraft,
  isIsoDate,
  localIsoDate,
  readBulletinDateDraft,
  removeBulletinDateDraft,
  resolveBulletinDisplayDate,
  writeBulletinDateDraft,
} from "../lib/bulletin-date";
import {
  accessBrowserStorage,
  failureRefreshDelayMs,
  readCachedBulletinSnapshot,
  successRefreshDelayMs,
  writeCachedBulletinSnapshot,
  type BrowserStorage,
} from "../lib/bulletin-recovery";
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
  type NextSessionBuyValidationError,
} from "../lib/narrative-editor-state";
import type { BulletinNarrative, BulletinSnapshot } from "../lib/types";
import { BulletinCanvas } from "./bulletin-canvas";
import { NarrativeEditor } from "./narrative-editor";
import { PreviewViewport } from "./preview-viewport";

type EditorStatus = {
  message: string;
  tone: "neutral" | "success" | "warning" | "error";
};

function editorStatusReducer(_state: EditorStatus, nextState: EditorStatus) {
  return nextState;
}

const unavailableBrowserStorage: BrowserStorage = {
  getItem: () => { throw new Error("Browser storage is unavailable"); },
  setItem: () => { throw new Error("Browser storage is unavailable"); },
  removeItem: () => { throw new Error("Browser storage is unavailable"); },
};

function browserStorage(): BrowserStorage {
  return accessBrowserStorage(() => window.localStorage) ?? unavailableBrowserStorage;
}

export function BulletinDashboard() {
  const [snapshot, setSnapshot] = useState<BulletinSnapshot | null>(null);
  const snapshotRef = useRef<BulletinSnapshot | null>(null);
  const [isUsingStaleSnapshot, setIsUsingStaleSnapshot] = useState(false);
  const [computerDate, setComputerDate] = useState("");
  const [dateEditor, dispatchDateEditor] = useReducer(bulletinDateEditorReducer, {
    sourceDate: "",
    draft: "",
    rendered: "",
  });
  const [message, setMessage] = useState("Đang tải dữ liệu.");
  const [isExporting, setIsExporting] = useState(false);
  const [editorStatus, updateEditorStatus] = useReducer(editorStatusReducer, {
    message: "Đang chờ ngày bản tin.",
    tone: "neutral",
  });
  const hasEdited = useRef(false);
  const nextBuyId = useRef(0);
  const [validationErrors, setValidationErrors] = useState<NextSessionBuyValidationError[]>([]);
  const [editorState, dispatchEditor] = useReducer(
    narrativeEditorReducer,
    createNarrativeEditorState("", DEFAULT_BULLETIN_NARRATIVE, null),
  );
  const bulletinDisplayDate = resolveBulletinDisplayDate(dateEditor.rendered || computerDate, snapshot?.asOfDate);

  const refresh = useCallback(async (): Promise<boolean> => {
    setComputerDate(localIsoDate(new Date()));
    try {
      const response = await fetch("/api/bulletin", { cache: "no-store" });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: { message?: unknown } } | null;
        const errorMessage = typeof body?.error?.message === "string"
          ? body.error.message
          : "Dữ liệu bản tin chưa sẵn sàng.";
        throw new Error(errorMessage);
      }
      const nextSnapshot = await response.json() as BulletinSnapshot;
      snapshotRef.current = nextSnapshot;
      setSnapshot(nextSnapshot);
      setIsUsingStaleSnapshot(nextSnapshot.dataStatus?.stale === true);
      writeCachedBulletinSnapshot(browserStorage(), nextSnapshot);
      setMessage(nextSnapshot.dataStatus?.warning
        ?? (nextSnapshot.dataStatus?.stale ? "Đang hiển thị dữ liệu gần nhất; chức năng xuất PNG tạm khóa." : "Dữ liệu đã được cập nhật."));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Không thể tải dữ liệu.";
      const fallback = snapshotRef.current ?? readCachedBulletinSnapshot(browserStorage());
      if (fallback) {
        snapshotRef.current = fallback;
        setSnapshot(fallback);
        setIsUsingStaleSnapshot(true);
        setMessage(`${errorMessage} Đang hiển thị dữ liệu gần nhất; chức năng xuất PNG tạm khóa.`);
      } else {
        setMessage(`${errorMessage} Hệ thống sẽ tự thử lại.`);
      }
      return false;
    }
  }, []);

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;
    const poll = async () => {
      const successful = await refresh();
      if (!stopped) {
        timer = window.setTimeout(() => void poll(), successful ? successRefreshDelayMs() : failureRefreshDelayMs());
      }
    };
    timer = window.setTimeout(() => void poll(), 0);
    return () => {
      stopped = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [refresh]);

  useEffect(() => {
    if (!snapshot) return;
    const source = resolveSourceNarrative(snapshot.narrative);
    if (editorState.asOfDate === snapshot.asOfDate) {
      dispatchEditor({ type: "refresh-source", asOfDate: snapshot.asOfDate, source });
      return;
    }

    const result = readNarrativeDraft(browserStorage(), snapshot.asOfDate);
    dispatchEditor({
      type: "load",
      asOfDate: snapshot.asOfDate,
      source,
      savedDraft: result.value?.narrative ?? null,
    });
    hasEdited.current = false;
    if (!result.ok) {
      updateEditorStatus({ message: result.message, tone: "error" });
    } else if (result.value) {
      updateEditorStatus({ message: "Đã nạp bản nháp của ngày hiện tại.", tone: "warning" });
    } else {
      updateEditorStatus({ message: "Sẵn sàng nhập nhận định.", tone: "neutral" });
    }
  }, [snapshot, editorState.asOfDate]);

  useEffect(() => {
    if (!snapshot || dateEditor.sourceDate === snapshot.asOfDate) return;
    const fallbackDate = computerDate || localIsoDate(new Date());
    const result = readBulletinDateDraft(browserStorage(), snapshot.asOfDate);
    dispatchDateEditor({
      type: "load",
      sourceDate: snapshot.asOfDate,
      draft: result.value?.displayDate ?? fallbackDate,
      rendered: fallbackDate,
    });
    if (!result.ok) {
      updateEditorStatus({ message: result.message, tone: "error" });
    } else if (result.value) {
      updateEditorStatus({ message: "Đã nạp ngày hiển thị đã lưu. Bấm Render để áp dụng.", tone: "warning" });
    }
  }, [computerDate, dateEditor.sourceDate, snapshot]);

  useEffect(() => {
    if (!hasEdited.current || !snapshot || editorState.asOfDate !== snapshot.asOfDate || dateEditor.sourceDate !== snapshot.asOfDate) return;
    const asOfDate = editorState.asOfDate;
    const timer = window.setTimeout(() => {
      const narrativeResult = writeNarrativeDraft(
        browserStorage(),
        createNarrativeDraftPayload(asOfDate, editorState.draft),
      );
      const dateResult = isIsoDate(dateEditor.draft)
        ? writeBulletinDateDraft(browserStorage(), createBulletinDateDraft(asOfDate, dateEditor.draft))
        : { ok: false as const, value: null, message: "Ngày hiển thị chưa hợp lệ." };
      const failedResult = !narrativeResult.ok ? narrativeResult : !dateResult.ok ? dateResult : null;
      updateEditorStatus(failedResult
        ? { message: failedResult.message, tone: "error" }
        : { message: `Đã tự lưu lúc ${new Date(narrativeResult.value.savedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}.`, tone: "success" });
    }, BULLETIN_CONFIG.narrativeAutosaveDelayMs);
    return () => window.clearTimeout(timer);
  }, [dateEditor.draft, dateEditor.sourceDate, editorState.asOfDate, editorState.draft, snapshot]);

  const markDraftChanged = () => {
    hasEdited.current = true;
    updateEditorStatus({ message: "Đang tự lưu bản nháp…", tone: "neutral" });
  };

  const changeNarrative = (field: keyof BulletinNarrative, value: string) => {
    dispatchEditor({ type: "edit", field, value });
    markDraftChanged();
  };

  const changeDisplayDate = (value: string) => {
    dispatchDateEditor({ type: "edit", value });
    markDraftChanged();
  };

  const addNextSessionBuy = () => {
    nextBuyId.current += 1;
    dispatchEditor({
      type: "add-buy",
      row: { id: `buy-${Date.now()}-${nextBuyId.current}`, ticker: "", buyZone: "" },
    });
    markDraftChanged();
  };

  const editNextSessionBuy = (id: string, field: "ticker" | "buyZone", value: string) => {
    dispatchEditor({ type: "edit-buy", id, field, value });
    setValidationErrors((current) => current.filter((error) => error.rowId !== id || error.field !== field));
    markDraftChanged();
  };

  const removeNextSessionBuy = (id: string) => {
    dispatchEditor({ type: "remove-buy", id });
    setValidationErrors((current) => current.filter((error) => error.rowId !== id));
    markDraftChanged();
  };

  const renderNarrative = () => {
    if (!snapshot || editorState.asOfDate !== snapshot.asOfDate) return;
    if (!isIsoDate(dateEditor.draft)) {
      updateEditorStatus({ message: "Vui lòng nhập ngày hiển thị hợp lệ.", tone: "error" });
      window.requestAnimationFrame(() => document.getElementById("bulletin-display-date")?.focus());
      return;
    }
    const errors = validateNextSessionBuys(editorState.draft.nextSessionBuys);
    setValidationErrors(errors);
    if (errors.length > 0) {
      const firstError = errors[0];
      updateEditorStatus({ message: "Vui lòng hoàn tất danh sách điểm mua trước khi render.", tone: "error" });
      window.requestAnimationFrame(() => {
        const suffix = firstError.field === "ticker" ? "ticker" : "zone";
        document.getElementById(`buy-${firstError.rowId}-${suffix}`)?.focus();
      });
      return;
    }
    const narrativeResult = writeNarrativeDraft(
      browserStorage(),
      createNarrativeDraftPayload(editorState.asOfDate, editorState.draft),
    );
    const dateResult = writeBulletinDateDraft(
      browserStorage(),
      createBulletinDateDraft(editorState.asOfDate, dateEditor.draft),
    );
    dispatchEditor({ type: "render" });
    dispatchDateEditor({ type: "render" });
    setValidationErrors([]);
    hasEdited.current = false;
    const failedResult = !narrativeResult.ok ? narrativeResult : !dateResult.ok ? dateResult : null;
    updateEditorStatus(!failedResult
      ? { message: "Đã render nội dung lên bản tin.", tone: "success" }
      : { message: `${failedResult.message} Nội dung vẫn được render trong phiên này.`, tone: "error" });
  };

  const resetNarrative = () => {
    if (!snapshot || editorState.asOfDate !== snapshot.asOfDate) return;
    const narrativeResult = removeNarrativeDraft(browserStorage(), snapshot.asOfDate);
    const dateResult = removeBulletinDateDraft(browserStorage(), snapshot.asOfDate);
    const failedResult = !narrativeResult.ok ? narrativeResult : !dateResult.ok ? dateResult : null;
    if (failedResult) {
      updateEditorStatus({ message: failedResult.message, tone: "error" });
      return;
    }
    const fallbackDate = computerDate || localIsoDate(new Date());
    dispatchEditor({ type: "reset" });
    dispatchDateEditor({ type: "reset", value: fallbackDate });
    setValidationErrors([]);
    hasEdited.current = false;
    updateEditorStatus({ message: "Đã khôi phục nội dung gốc.", tone: "success" });
  };

  const exportPng = async () => {
    const canvas = document.getElementById("bulletin-canvas");
    if (!canvas || !snapshot || isUsingStaleSnapshot) return;
    setIsExporting(true);
    try {
      await document.fonts.ready;
      const dataUrl = await toPng(canvas, { canvasWidth: BULLETIN_CONFIG.canvasWidth, canvasHeight: BULLETIN_CONFIG.canvasHeight, pixelRatio: 1 });
      const link = document.createElement("a");
      link.download = `cnf-morning-bulletin_${bulletinDisplayDate ?? snapshot.asOfDate}.png`;
      link.href = dataUrl;
      link.click();
      setMessage("Đã xuất ảnh PNG.");
    } catch {
      setMessage("Không thể xuất ảnh. Vui lòng thử lại.");
    } finally { setIsExporting(false); }
  };

  const sourceNarrative = resolveSourceNarrative(snapshot?.narrative ?? null);
  const previewNarrative = snapshot
    ? resolvePreviewNarrative(editorState, snapshot.asOfDate, sourceNarrative)
    : { ...sourceNarrative, nextSessionBuys: [] };
  const { nextSessionBuys: previewNextSessionBuys, ...previewNarrativeFields } = previewNarrative;
  const previewSnapshot = snapshot ? { ...snapshot, narrative: previewNarrativeFields } : null;
  const editorReady = Boolean(snapshot
    && editorState.asOfDate === snapshot.asOfDate
    && dateEditor.sourceDate === snapshot.asOfDate);
  const editorDraft = editorReady
    ? editorState.draft
    : { ...sourceNarrative, nextSessionBuys: [] };

  return (
    <main className="bulletin-app-shell">
      <NarrativeEditor
        asOfDate={snapshot?.asOfDate ?? null}
        displayDate={dateEditor.draft}
        draft={editorDraft}
        disabled={!editorReady}
        hasUnrenderedChanges={editorReady && (editorState.hasUnrenderedChanges || dateEditor.draft !== dateEditor.rendered)}
        statusMessage={editorStatus.message}
        statusTone={editorStatus.tone}
        validationErrors={validationErrors}
        onDisplayDateChange={changeDisplayDate}
        onChange={changeNarrative}
        onAddBuy={addNextSessionBuy}
        onEditBuy={editNextSessionBuy}
        onRemoveBuy={removeNextSessionBuy}
        onRender={renderNarrative}
        onReset={resetNarrative}
      />
      <section className="preview-workspace" aria-label="Xem trước bản tin">
        <div className="export-toolbar">
          <span aria-live="polite">{snapshot
            ? `${isUsingStaleSnapshot ? "Dữ liệu dự phòng" : "Cập nhật"}: ${new Date(snapshot.generatedAt).toLocaleString("vi-VN")}`
            : message}</span>
          <button type="button" onClick={() => void exportPng()} disabled={!snapshot || isExporting || isUsingStaleSnapshot} title={isUsingStaleSnapshot ? "Chờ dữ liệu mới trước khi xuất PNG" : undefined}>
            {isExporting ? "Đang xuất…" : "Xuất PNG 1920×1080"}
          </button>
        </div>
        <PreviewViewport canvasWidth={BULLETIN_CONFIG.canvasWidth} canvasHeight={BULLETIN_CONFIG.canvasHeight}>
          <BulletinCanvas
            snapshot={previewSnapshot}
            displayDate={bulletinDisplayDate ?? undefined}
            nextSessionBuys={previewNextSessionBuys}
          />
        </PreviewViewport>
        <p className="dashboard-state" aria-live="polite">{message}</p>
      </section>
    </main>
  );
}
