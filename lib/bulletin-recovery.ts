import { BULLETIN_CONFIG } from "../config/filters";
import type { BulletinSnapshot } from "./types";

export type BrowserStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type SnapshotStorage = Pick<BrowserStorage, "getItem" | "setItem">;

type CachedSnapshotPayload = {
  version: number;
  savedAt: string;
  snapshot: BulletinSnapshot;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBulletinSnapshot(value: unknown): value is BulletinSnapshot {
  if (!isRecord(value)) return false;
  const marketBreadth = value.marketBreadth;
  if (!isRecord(marketBreadth)) return false;
  return typeof value.asOfDate === "string"
    && typeof value.generatedAt === "string"
    && typeof value.vnIndexRoc26 === "number"
    && Array.isArray(value.sectors)
    && Array.isArray(value.strongStocks)
    && Array.isArray(value.potentialStocks)
    && ["ma10", "ma20", "ma50", "ma200"].every((key) => typeof marketBreadth[key] === "number");
}

function parsePayload(raw: string | null): CachedSnapshotPayload | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)
      || value.version !== BULLETIN_CONFIG.lastSuccessfulSnapshotVersion
      || typeof value.savedAt !== "string"
      || !isBulletinSnapshot(value.snapshot)) return null;
    return value as CachedSnapshotPayload;
  } catch {
    return null;
  }
}

export function accessBrowserStorage(getStorage: () => BrowserStorage): BrowserStorage | null {
  try {
    return getStorage();
  } catch {
    return null;
  }
}

export function readCachedBulletinSnapshot(storage: SnapshotStorage): BulletinSnapshot | null {
  try {
    return parsePayload(storage.getItem(BULLETIN_CONFIG.lastSuccessfulSnapshotStorageKey))?.snapshot ?? null;
  } catch {
    return null;
  }
}

export function writeCachedBulletinSnapshot(storage: SnapshotStorage, snapshot: BulletinSnapshot): boolean {
  try {
    const existing = parsePayload(storage.getItem(BULLETIN_CONFIG.lastSuccessfulSnapshotStorageKey));
    if (existing && Date.parse(existing.snapshot.generatedAt) > Date.parse(snapshot.generatedAt)) return true;
    const payload: CachedSnapshotPayload = {
      version: BULLETIN_CONFIG.lastSuccessfulSnapshotVersion,
      savedAt: new Date().toISOString(),
      snapshot,
    };
    storage.setItem(BULLETIN_CONFIG.lastSuccessfulSnapshotStorageKey, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function successRefreshDelayMs() {
  return BULLETIN_CONFIG.clientRefreshIntervalMs;
}

export function failureRefreshDelayMs() {
  return BULLETIN_CONFIG.clientFailureRefreshIntervalMs;
}
