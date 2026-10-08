export const BULLETIN_CONFIG = {
  clientRefreshIntervalMs: 300_000,
  clientFailureRefreshIntervalMs: 15_000,
  serverCacheTtlMs: 300_000,
  sourceFetchMaxAttempts: 3,
  sourceFetchRetryDelayMs: 250,
  sourceFetchTimeoutMs: 8_000,
  lastSuccessfulSnapshotStorageKey: "cnf:bulletin:last-success",
  lastSuccessfulSnapshotVersion: 1,
  narrativeAutosaveDelayMs: 350,
  canvasWidth: 1920,
  canvasHeight: 1080,
  topLimit: 10
} as const;

export const STRONG_STOCK_FILTER = {
  minimumVolume: 300_000
} as const;

export const POTENTIAL_STOCK_FILTER = {
  minimumVolume: 300_000,
  rsMinimum: 75,
  rsMaximum: 90,
  roc26Minimum: 10,
  roc26Maximum: 20,
  minimumVolumeRatio: 1.5
} as const;
