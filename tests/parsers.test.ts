import { describe, expect, it } from "vitest";
import { parseNumber } from "../lib/parsers";

describe("parseNumber", () => {
  it("test_returns_null_when_value_is_not_a_number", () => {
    expect(parseNumber("#N/A")).toBeNull();
  });

  it("test_parses_vietnamese_formatted_number", () => {
    expect(parseNumber("1.234.567,89")).toBe(1_234_567.89);
  });
});
