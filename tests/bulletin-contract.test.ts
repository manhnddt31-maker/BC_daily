import { describe, expect, it } from "vitest";
import snapshot from "./fixtures/bulletin-snapshot-contract.json";

describe("hợp đồng snapshot backend", () => {
  it("test_fixture_giữ_trường_hiện_tại_và_bổ_sung_trạng_thái_dữ_liệu", () => {
    // Fixture khóa hợp đồng chuyển tiếp mà giao diện sẽ nhận từ FastAPI.
    expect(snapshot).toMatchObject({
      asOfDate: expect.any(String),
      generatedAt: expect.any(String),
      vnIndexRoc26: expect.any(Number),
      sectors: expect.any(Array),
      strongStocks: expect.any(Array),
      potentialStocks: expect.any(Array),
      marketBreadth: {
        ma10: expect.any(Number),
        ma20: expect.any(Number),
        ma50: expect.any(Number),
        ma200: expect.any(Number),
      },
      narrative: null,
      dataStatus: {
        source: "vnstock",
        stale: false,
        lastAttemptAt: expect.any(String),
        warning: null,
      },
    });
  });
});
