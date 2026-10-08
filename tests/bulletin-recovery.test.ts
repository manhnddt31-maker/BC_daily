import { describe, expect, it } from "vitest";
import {
  accessBrowserStorage,
  failureRefreshDelayMs,
  readCachedBulletinSnapshot,
  successRefreshDelayMs,
  writeCachedBulletinSnapshot,
} from "../lib/bulletin-recovery";
import type { BulletinSnapshot } from "../lib/types";

function snapshot(generatedAt = "2026-08-12T02:00:00.000Z"): BulletinSnapshot {
  return {
    asOfDate: "2026-08-11",
    generatedAt,
    vnIndexRoc26: -3.8,
    sectors: [{ name: "Ngân hàng", averagePercent: 1 }],
    strongStocks: [],
    potentialStocks: [],
    marketBreadth: { ma10: 70, ma20: 60, ma50: 50, ma200: 40 },
    narrative: null,
  };
}

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
}

describe("bulletin data recovery", () => {
  it("test_blocked_browser_storage_is_ignored_without_throwing", () => {
    // Browser privacy policy can throw before localStorage methods are reached.
    const getStorage = () => {
      throw new DOMException("Access denied", "SecurityError");
    };

    const result = accessBrowserStorage(getStorage);

    expect(result).toBeNull();
  });

  it("test_last_successful_snapshot_round_trips_for_stale_fallback", () => {
    // A successful response must remain available when the next network load fails.
    const storage = memoryStorage();
    const expected = snapshot();

    writeCachedBulletinSnapshot(storage, expected);
    const result = readCachedBulletinSnapshot(storage);

    expect(result).toEqual(expected);
  });

  it("test_invalid_cached_snapshot_is_ignored_without_throwing", () => {
    // Corrupt or obsolete browser data must never crash initial loading.
    const storage = memoryStorage({ "cnf:bulletin:last-success": JSON.stringify({ version: 99, snapshot: {} }) });

    const result = readCachedBulletinSnapshot(storage);

    expect(result).toBeNull();
  });

  it("test_failure_retry_delay_is_shorter_than_normal_refresh_delay", () => {
    // Recovery should happen promptly while successful polling remains conservative.
    expect(failureRefreshDelayMs()).toBeLessThan(successRefreshDelayMs());
  });
});
