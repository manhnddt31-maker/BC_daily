import { afterEach, describe, expect, it, vi } from "vitest";

import { getBackendBulletinSnapshot } from "../lib/backend-bulletin";
import snapshot from "./fixtures/bulletin-snapshot-contract.json";

describe("FastAPI bulletin client", () => {
  afterEach(() => {
    delete process.env.BACKEND_API_URL;
    delete process.env.BACKEND_SERVICE_TOKEN;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
  });

  it("gửi token chỉ ở server và trả snapshot không chứa bí mật", async () => {
    process.env.BACKEND_API_URL = "http://backend:8000";
    process.env.BACKEND_SERVICE_TOKEN = "server-only-secret";
    const fetcher = vi.fn(async () => Response.json(snapshot));

    const result = await getBackendBulletinSnapshot(fetcher);

    expect(fetcher).toHaveBeenCalledWith(
      "http://backend:8000/api/v1/bulletin/latest",
      expect.objectContaining({
        cache: "no-store",
        headers: { Authorization: "Bearer server-only-secret" },
      }),
    );
    expect(JSON.stringify(result)).not.toContain("server-only-secret");
  });

  it("đọc snapshot latest từ Supabase khi Vercel có cấu hình cloud", async () => {
    process.env.SUPABASE_URL = "https://project.supabase.co/";
    process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    const fetcher = vi.fn(async () => Response.json([{ payload: snapshot }]));

    const result = await getBackendBulletinSnapshot(fetcher);

    expect(fetcher).toHaveBeenCalledWith(
      "https://project.supabase.co/rest/v1/bulletin_publications?slug=eq.latest&select=payload&limit=1",
      expect.objectContaining({
        cache: "no-store",
        headers: { apikey: "sb_publishable_test" },
      }),
    );
    expect(result).toEqual(snapshot);
  });
});
