import { describe, it, expect } from "vitest";
import { formatDayMonth, formatDayMonthNumeric } from "../dateFormat";

describe("formatDayMonth", () => {
  it("formats day and Spanish short month for es locale", () => {
    const result = formatDayMonth("2026-06-24", "es");
    expect(result).toMatch(/24/);
    expect(result.toLowerCase()).toMatch(/jun/);
  });

  it("handles single-digit day", () => {
    const result = formatDayMonth("2026-01-05", "es");
    expect(result).toMatch(/5/);
  });
});

describe("formatDayMonthNumeric", () => {
  it("formats as zero-padded day/month", () => {
    expect(formatDayMonthNumeric("2026-07-06")).toBe("06/07");
  });

  it("preserves zero-padding for single-digit day and month", () => {
    expect(formatDayMonthNumeric("2026-01-05")).toBe("05/01");
  });
});
