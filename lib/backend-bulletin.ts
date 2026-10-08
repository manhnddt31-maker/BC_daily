import type { BulletinSnapshot } from "./types";
import { BULLETIN_CONFIG } from "../config/filters";

export class BackendBulletinError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    readonly retryable: boolean,
  ) {
    super("Không thể tải dữ liệu bản tin từ backend.");
    this.name = "BackendBulletinError";
  }
}

function backendConfig(): { url: string; token: string } {
  const url = process.env.BACKEND_API_URL?.trim().replace(/\/$/u, "") ?? "";
  const token = process.env.BACKEND_SERVICE_TOKEN?.trim() ?? "";
  if (!url || !token) {
    throw new BackendBulletinError("BACKEND_NOT_CONFIGURED", 503, false);
  }
  return { url, token };
}

function supabaseConfig(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/$/u, "") ?? "";
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";
  if (!url && !key) return null;
  if (!url || !key) {
    throw new BackendBulletinError("SUPABASE_NOT_CONFIGURED", 503, false);
  }
  return { url, key };
}

function isBulletinSnapshot(value: unknown): value is BulletinSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<BulletinSnapshot>;
  return typeof snapshot.asOfDate === "string"
    && typeof snapshot.generatedAt === "string"
    && Array.isArray(snapshot.sectors)
    && Array.isArray(snapshot.strongStocks)
    && Array.isArray(snapshot.potentialStocks)
    && Boolean(snapshot.marketBreadth && typeof snapshot.marketBreadth === "object");
}

async function getSupabaseBulletinSnapshot(
  config: { url: string; key: string },
  fetcher: typeof fetch,
): Promise<BulletinSnapshot> {
  let response: Response;
  try {
    response = await fetcher(
      `${config.url}/rest/v1/bulletin_publications?slug=eq.latest&select=payload&limit=1`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(BULLETIN_CONFIG.sourceFetchTimeoutMs),
        headers: { apikey: config.key },
      },
    );
  } catch {
    throw new BackendBulletinError("SUPABASE_UNREACHABLE", 503, true);
  }
  if (!response.ok) {
    throw new BackendBulletinError("SUPABASE_ERROR", 503, response.status >= 500);
  }
  const rows = (await response.json().catch(() => null)) as unknown;
  const payload = Array.isArray(rows) && rows.length > 0
    ? (rows[0] as { payload?: unknown } | undefined)?.payload
    : null;
  if (!isBulletinSnapshot(payload)) {
    throw new BackendBulletinError("NO_SNAPSHOT", 503, false);
  }
  return payload;
}

export async function getBackendBulletinSnapshot(
  fetcher: typeof fetch = fetch,
): Promise<BulletinSnapshot> {
  const cloud = supabaseConfig();
  if (cloud) return getSupabaseBulletinSnapshot(cloud, fetcher);
  const config = backendConfig();
  let response: Response;
  try {
    response = await fetcher(`${config.url}/api/v1/bulletin/latest`, {
      cache: "no-store",
      signal: AbortSignal.timeout(BULLETIN_CONFIG.sourceFetchTimeoutMs),
      headers: { Authorization: `Bearer ${config.token}` },
    });
  } catch {
    throw new BackendBulletinError("BACKEND_UNREACHABLE", 503, true);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: { code?: string } }
      | null;
    throw new BackendBulletinError(
      body?.error?.code ?? "BACKEND_ERROR",
      response.status >= 500 ? 503 : response.status,
      response.status >= 500,
    );
  }
  return (await response.json()) as BulletinSnapshot;
}
