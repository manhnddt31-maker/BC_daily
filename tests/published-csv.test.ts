import { describe, expect, it, vi } from "vitest";
import { fetchPublishedCsvRows } from "../lib/published-csv";

describe("fetchPublishedCsvRows", () => {
  it("test_parses_csv_rows_from_a_public_url", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("Ticker,ROC26\nAAA,15\n"));

    await expect(fetchPublishedCsvRows("https://example.com/data.csv", fetcher)).resolves.toEqual([
      ["Ticker", "ROC26"],
      ["AAA", "15"]
    ]);
  });

  it("preserves commas that are part of a quoted value", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response('Ticker,Volume\nCTF,"333,400"\n', { status: 200 }),
    );

    await expect(fetchPublishedCsvRows("https://example.test/data.csv", fetcher)).resolves.toEqual([
      ["Ticker", "Volume"],
      ["CTF", "333,400"],
    ]);
  });

  it("test_retryable_source_failure_recovers_before_reaching_the_client", async () => {
    // A transient upstream failure must be retried before the bulletin request fails.
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response("temporary", { status: 503 }))
      .mockResolvedValueOnce(new Response("Ticker,ROC26\nVNINDEX,-3.8\n", { status: 200 }));

    const rows = await fetchPublishedCsvRows("https://example.test/data.csv", fetcher, {
      source: "Data_26D",
      maxAttempts: 2,
      retryDelayMs: 0,
      timeoutMs: 1_000,
      sleep: vi.fn().mockResolvedValue(undefined),
    });

    expect({ rows, calls: fetcher.mock.calls.length }).toEqual({
      rows: [["Ticker", "ROC26"], ["VNINDEX", "-3.8"]],
      calls: 2,
    });
  });

  it("test_non_retryable_source_failure_reports_the_safe_source_name", async () => {
    // Permission errors must fail once and preserve only safe diagnostic context.
    const fetcher = vi.fn().mockResolvedValue(new Response("forbidden", { status: 403 }));

    const request = fetchPublishedCsvRows("https://example.test/private-id.csv", fetcher, {
      source: "Data Clean",
      maxAttempts: 3,
      retryDelayMs: 0,
      timeoutMs: 1_000,
      sleep: vi.fn().mockResolvedValue(undefined),
    });

    await expect(request).rejects.toMatchObject({
      code: "SOURCE_UNAVAILABLE",
      source: "Data Clean",
      status: 403,
      retryable: false,
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
