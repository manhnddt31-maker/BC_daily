const DATE_DRAFT_VERSION = 1 as const;
const DATE_STORAGE_KEY_PREFIX = "cnf-daily-display-date:";

export type BulletinDateDraft = {
  version: typeof DATE_DRAFT_VERSION;
  asOfDate: string;
  displayDate: string;
  savedAt: string;
};

type DateStorageResult<T> =
  | { ok: true; value: T }
  | { ok: false; value: T; message: string };

export type BulletinDateEditorState = {
  sourceDate: string;
  draft: string;
  rendered: string;
};

export type BulletinDateEditorAction =
  | { type: "load"; sourceDate: string; draft: string; rendered: string }
  | { type: "edit"; value: string }
  | { type: "render" }
  | { type: "reset"; value: string };

export function bulletinDateEditorReducer(
  state: BulletinDateEditorState,
  action: BulletinDateEditorAction,
): BulletinDateEditorState {
  if (action.type === "load") return { sourceDate: action.sourceDate, draft: action.draft, rendered: action.rendered };
  if (action.type === "edit") return { ...state, draft: action.value };
  if (action.type === "render") return { ...state, rendered: state.draft };
  return { ...state, draft: action.value, rendered: action.value };
}

export function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function bulletinDateStorageKey(asOfDate: string) {
  return `${DATE_STORAGE_KEY_PREFIX}${asOfDate}`;
}

export function createBulletinDateDraft(
  asOfDate: string,
  displayDate: string,
  savedAt = new Date().toISOString(),
): BulletinDateDraft {
  return { version: DATE_DRAFT_VERSION, asOfDate, displayDate, savedAt };
}

export function readBulletinDateDraft(
  storage: Pick<Storage, "getItem">,
  asOfDate: string,
): DateStorageResult<BulletinDateDraft | null> {
  try {
    const raw = storage.getItem(bulletinDateStorageKey(asOfDate));
    if (raw === null) return { ok: true, value: null };
    const value = JSON.parse(raw) as Partial<BulletinDateDraft>;
    if (value.version !== DATE_DRAFT_VERSION
      || value.asOfDate !== asOfDate
      || typeof value.savedAt !== "string"
      || typeof value.displayDate !== "string"
      || !isIsoDate(value.displayDate)) {
      return { ok: false, value: null, message: "Ngày bản tin đã lưu không hợp lệ." };
    }
    return { ok: true, value: value as BulletinDateDraft };
  } catch {
    return { ok: false, value: null, message: "Không thể đọc ngày bản tin trong trình duyệt." };
  }
}

export function writeBulletinDateDraft(
  storage: Pick<Storage, "setItem">,
  payload: BulletinDateDraft,
): DateStorageResult<BulletinDateDraft> {
  try {
    storage.setItem(bulletinDateStorageKey(payload.asOfDate), JSON.stringify(payload));
    return { ok: true, value: payload };
  } catch {
    return { ok: false, value: payload, message: "Không thể lưu ngày bản tin trong trình duyệt." };
  }
}

export function removeBulletinDateDraft(
  storage: Pick<Storage, "removeItem">,
  asOfDate: string,
): DateStorageResult<null> {
  try {
    storage.removeItem(bulletinDateStorageKey(asOfDate));
    return { ok: true, value: null };
  } catch {
    return { ok: false, value: null, message: "Không thể xóa ngày bản tin trong trình duyệt." };
  }
}

export function localIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function resolveBulletinDisplayDate(
  computerDate: string,
  sourceDate: string | null | undefined,
) {
  return computerDate || sourceDate || null;
}
