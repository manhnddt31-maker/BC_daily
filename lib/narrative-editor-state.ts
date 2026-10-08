import type { BulletinEditorContent, BulletinNarrative, NextSessionBuy } from "./types";

const DRAFT_VERSION = 2 as const;
const STORAGE_KEY_PREFIX = "cnf-daily-narrative:";
export const MAX_NEXT_SESSION_BUYS = 4;

export const DEFAULT_BULLETIN_NARRATIVE: BulletinNarrative = {
  conclusion: "Dữ liệu định lượng, sức mạnh ngành, độ rộng thị trường và các danh sách cổ phiếu đã được cập nhật tự động từ nguồn vnstock (VCI).",
  action: "Nội dung nhận định định tính chưa được xuất bản. Các kết quả trên là dữ liệu sàng lọc, không phải khuyến nghị mua bán.",
  footer: "Dữ liệu định lượng đã được cập nhật tự động. Nhận định định tính cho phiên này chưa được xuất bản.",
};

export type NarrativeDraftPayload = {
  version: typeof DRAFT_VERSION;
  asOfDate: string;
  narrative: BulletinEditorContent;
  savedAt: string;
};

export type StorageResult<T> =
  | { ok: true; value: T }
  | { ok: false; value: T; message: string };

export type NextSessionBuyValidationError = {
  rowId: string;
  field: "ticker" | "buyZone";
  message: string;
};

export function validateNextSessionBuys(
  rows: readonly NextSessionBuy[],
): NextSessionBuyValidationError[] {
  const errors: NextSessionBuyValidationError[] = [];
  const seenTickers = new Set<string>();
  for (const row of rows) {
    const ticker = row.ticker.trim().toUpperCase();
    if (!ticker) {
      errors.push({ rowId: row.id, field: "ticker", message: "Vui lòng nhập mã cổ phiếu." });
    } else if (seenTickers.has(ticker)) {
      errors.push({ rowId: row.id, field: "ticker", message: "Mã cổ phiếu đã xuất hiện." });
    } else {
      seenTickers.add(ticker);
    }
    if (!row.buyZone.trim()) {
      errors.push({ rowId: row.id, field: "buyZone", message: "Vui lòng nhập vùng theo dõi." });
    }
  }
  return errors;
}

export type NarrativeEditorState = {
  asOfDate: string;
  source: BulletinEditorContent;
  draft: BulletinEditorContent;
  rendered: BulletinEditorContent;
  hasRenderedOverride: boolean;
  hasUnrenderedChanges: boolean;
};

export type NarrativeEditorAction =
  | { type: "edit"; field: keyof BulletinNarrative; value: string }
  | { type: "add-buy"; row: NextSessionBuy }
  | {
      type: "edit-buy";
      id: string;
      field: "ticker" | "buyZone";
      value: string;
    }
  | { type: "remove-buy"; id: string }
  | { type: "render" }
  | { type: "reset" }
  | {
      type: "load";
      asOfDate: string;
      source: BulletinNarrative;
      savedDraft: BulletinNarrative | BulletinEditorContent | null;
    }
  | { type: "refresh-source"; asOfDate: string; source: BulletinNarrative };

function hasNextSessionBuys(
  value: BulletinNarrative | BulletinEditorContent,
): value is BulletinEditorContent {
  return "nextSessionBuys" in value;
}

function narrativesEqual(
  left: BulletinNarrative | BulletinEditorContent,
  right: BulletinNarrative | BulletinEditorContent,
) {
  const textEqual = left.conclusion === right.conclusion
    && left.action === right.action
    && left.footer === right.footer;
  if (!textEqual) return false;
  if (!hasNextSessionBuys(left) || !hasNextSessionBuys(right)) return true;
  return left.nextSessionBuys.length === right.nextSessionBuys.length
    && left.nextSessionBuys.every((row, index) => {
      const other = right.nextSessionBuys[index];
      return row.id === other.id
        && row.ticker === other.ticker
        && row.buyZone === other.buyZone;
    });
}

function toEditorContent(
  narrative: BulletinNarrative | BulletinEditorContent,
): BulletinEditorContent {
  return {
    ...narrative,
    nextSessionBuys: "nextSessionBuys" in narrative
      ? narrative.nextSessionBuys.map((row) => ({ ...row }))
      : [],
  };
}

function isNarrative(value: unknown): value is BulletinNarrative {
  if (!value || typeof value !== "object") return false;
  const narrative = value as Record<string, unknown>;
  return typeof narrative.conclusion === "string"
    && typeof narrative.action === "string"
    && typeof narrative.footer === "string";
}

function isNextSessionBuy(value: unknown): value is NextSessionBuy {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === "string"
    && typeof row.ticker === "string"
    && typeof row.buyZone === "string";
}

function isEditorContent(value: unknown): value is BulletinEditorContent {
  if (!isNarrative(value) || !("nextSessionBuys" in value)) return false;
  return Array.isArray(value.nextSessionBuys)
    && value.nextSessionBuys.length <= MAX_NEXT_SESSION_BUYS
    && value.nextSessionBuys.every(isNextSessionBuy);
}

function isDraftPayload(value: unknown, asOfDate: string): value is NarrativeDraftPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  return payload.version === DRAFT_VERSION
    && payload.asOfDate === asOfDate
    && typeof payload.savedAt === "string"
    && isEditorContent(payload.narrative);
}

function migrateLegacyDraftPayload(
  value: unknown,
  asOfDate: string,
): NarrativeDraftPayload | null {
  if (!value || typeof value !== "object") return null;
  const payload = value as Record<string, unknown>;
  if (payload.version !== 1
    || payload.asOfDate !== asOfDate
    || typeof payload.savedAt !== "string"
    || !isNarrative(payload.narrative)) return null;
  return createNarrativeDraftPayload(asOfDate, {
    conclusion: payload.narrative.conclusion,
    action: payload.narrative.action,
    footer: payload.narrative.footer,
  }, payload.savedAt);
}

export function narrativeStorageKey(asOfDate: string) {
  return `${STORAGE_KEY_PREFIX}${asOfDate}`;
}

export function createNarrativeDraftPayload(
  asOfDate: string,
  narrative: BulletinNarrative | BulletinEditorContent,
  savedAt = new Date().toISOString(),
): NarrativeDraftPayload {
  return { version: DRAFT_VERSION, asOfDate, narrative: toEditorContent(narrative), savedAt };
}

export function readNarrativeDraft(
  storage: Pick<Storage, "getItem">,
  asOfDate: string,
): StorageResult<NarrativeDraftPayload | null> {
  try {
    const raw = storage.getItem(narrativeStorageKey(asOfDate));
    if (raw === null) return { ok: true, value: null };
    const parsed: unknown = JSON.parse(raw);
    if (isDraftPayload(parsed, asOfDate)) return { ok: true, value: parsed };
    const migrated = migrateLegacyDraftPayload(parsed, asOfDate);
    return migrated
      ? { ok: true, value: migrated }
      : { ok: false, value: null, message: "Bản nháp đã lưu không hợp lệ." };
  } catch {
    return { ok: false, value: null, message: "Không thể đọc bản nháp trong trình duyệt." };
  }
}

export function writeNarrativeDraft(
  storage: Pick<Storage, "setItem">,
  payload: NarrativeDraftPayload,
): StorageResult<NarrativeDraftPayload> {
  try {
    storage.setItem(narrativeStorageKey(payload.asOfDate), JSON.stringify(payload));
    return { ok: true, value: payload };
  } catch {
    return { ok: false, value: payload, message: "Không thể lưu bản nháp trong trình duyệt." };
  }
}

export function removeNarrativeDraft(
  storage: Pick<Storage, "removeItem">,
  asOfDate: string,
): StorageResult<null> {
  try {
    storage.removeItem(narrativeStorageKey(asOfDate));
    return { ok: true, value: null };
  } catch {
    return { ok: false, value: null, message: "Không thể xóa bản nháp trong trình duyệt." };
  }
}

export function createNarrativeEditorState(
  asOfDate: string,
  source: BulletinNarrative,
  savedDraft: BulletinNarrative | BulletinEditorContent | null,
): NarrativeEditorState {
  const editorSource = toEditorContent(source);
  const draft = toEditorContent(savedDraft ?? source);
  return {
    asOfDate,
    source: editorSource,
    draft,
    rendered: editorSource,
    hasRenderedOverride: false,
    hasUnrenderedChanges: !narrativesEqual(draft, editorSource),
  };
}

export function resolveSourceNarrative(source: BulletinNarrative | null) {
  return source ?? DEFAULT_BULLETIN_NARRATIVE;
}

export function resolvePreviewNarrative(
  state: NarrativeEditorState | null,
  asOfDate: string,
  source: BulletinNarrative,
): BulletinEditorContent {
  return state?.asOfDate === asOfDate && state.hasRenderedOverride
    ? state.rendered
    : toEditorContent(source);
}

export function narrativeEditorReducer(
  state: NarrativeEditorState,
  action: NarrativeEditorAction,
): NarrativeEditorState {
  if (action.type === "refresh-source") {
    if (action.asOfDate !== state.asOfDate) return state;
    const source = toEditorContent(action.source);
    const draftFollowsSource = !state.hasRenderedOverride
      && !state.hasUnrenderedChanges
      && narrativesEqual(state.draft, state.source);
    const draft = draftFollowsSource ? source : state.draft;
    const rendered = state.hasRenderedOverride ? state.rendered : source;
    return {
      ...state,
      source,
      draft,
      rendered,
      hasUnrenderedChanges: !narrativesEqual(draft, rendered),
    };
  }
  if (action.type === "load") {
    return createNarrativeEditorState(action.asOfDate, action.source, action.savedDraft);
  }
  if (action.type === "reset") {
    return {
      ...state,
      draft: state.source,
      rendered: state.source,
      hasRenderedOverride: false,
      hasUnrenderedChanges: false,
    };
  }
  if (action.type === "render") {
    const rendered = {
      ...state.draft,
      nextSessionBuys: state.draft.nextSessionBuys.map((row) => ({
        ...row,
        ticker: row.ticker.trim().toUpperCase(),
        buyZone: row.buyZone.trim(),
      })),
    };
    return {
      ...state,
      draft: rendered,
      rendered,
      hasRenderedOverride: true,
      hasUnrenderedChanges: false,
    };
  }
  if (action.type === "add-buy") {
    if (state.draft.nextSessionBuys.length >= MAX_NEXT_SESSION_BUYS) return state;
    const draft = {
      ...state.draft,
      nextSessionBuys: [...state.draft.nextSessionBuys, action.row],
    };
    return {
      ...state,
      draft,
      hasUnrenderedChanges: !narrativesEqual(draft, state.rendered),
    };
  }
  if (action.type === "edit-buy") {
    const value = action.field === "ticker" ? action.value.toUpperCase() : action.value;
    const draft = {
      ...state.draft,
      nextSessionBuys: state.draft.nextSessionBuys.map((row) => (
        row.id === action.id ? { ...row, [action.field]: value } : row
      )),
    };
    return {
      ...state,
      draft,
      hasUnrenderedChanges: !narrativesEqual(draft, state.rendered),
    };
  }
  if (action.type === "remove-buy") {
    const draft = {
      ...state.draft,
      nextSessionBuys: state.draft.nextSessionBuys.filter((row) => row.id !== action.id),
    };
    return {
      ...state,
      draft,
      hasUnrenderedChanges: !narrativesEqual(draft, state.rendered),
    };
  }
  const draft = { ...state.draft, [action.field]: action.value };
  return {
    ...state,
    draft,
    hasUnrenderedChanges: !narrativesEqual(draft, state.rendered),
  };
}
