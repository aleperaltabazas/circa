import { describe, it, expect } from "vitest";
import {
  validateId,
  validateYearInEra,
  validateAnswerRange,
  validateNonEmpty,
  validateDate,
} from "../authoring/validators";

describe("validateId", () => {
  it("accepts a kebab-case id not in use", () => {
    expect(validateId("magna-carta-1215", ["lepanto-1571"])).toBeNull();
  });
  it("rejects an empty id", () => {
    expect(validateId("", [])).toMatch(/empty|required/i);
  });
  it("rejects an id with invalid characters", () => {
    expect(validateId("Foo Bar", [])).toMatch(/kebab|characters/i);
  });
  it("rejects an id already in use", () => {
    expect(validateId("lepanto-1571", ["lepanto-1571"])).toMatch(/already/i);
  });
});

describe("validateYearInEra", () => {
  it("accepts a year inside the era", () => {
    expect(validateYearInEra(1571, "modern")).toBeNull();
  });
  it("rejects a year before the era", () => {
    const msg = validateYearInEra(1400, "modern");
    expect(msg).toMatch(/not in/i);
    expect(msg).toMatch(/modern/);
  });
  it("rejects a year after the era", () => {
    const msg = validateYearInEra(1800, "modern");
    expect(msg).toMatch(/not in/i);
  });
});

describe("validateAnswerRange", () => {
  it("accepts from < to within era", () => {
    expect(validateAnswerRange(1789, 1799, "recent")).toBeNull();
  });
  it("rejects from > to", () => {
    expect(validateAnswerRange(1800, 1789, "recent")).toMatch(/from.*to/i);
  });
  it("rejects when from is outside the era", () => {
    expect(validateAnswerRange(1400, 1571, "modern")).toMatch(/not in/i);
  });
  it("rejects when to is outside the era", () => {
    expect(validateAnswerRange(1571, 1800, "modern")).toMatch(/not in/i);
  });
  it("accepts from === to (exact-year puzzle)", () => {
    expect(validateAnswerRange(1571, 1571, "modern")).toBeNull();
  });
});

describe("validateNonEmpty", () => {
  it("accepts non-empty text", () => {
    expect(validateNonEmpty("hello", "hint")).toBeNull();
  });
  it("rejects empty string", () => {
    expect(validateNonEmpty("", "hint")).toMatch(/hint/i);
  });
  it("rejects whitespace-only string", () => {
    expect(validateNonEmpty("   ", "hint")).toMatch(/hint/i);
  });
});

describe("validateDate", () => {
  it("accepts a valid date not in the list", () => {
    expect(validateDate("2026-12-31", ["2026-06-20"])).toBeNull();
  });
  it("rejects wrong format", () => {
    expect(validateDate("2026-6-1", [])).toMatch(/format/i);
  });
  it("rejects an invalid calendar date", () => {
    expect(validateDate("2026-02-30", [])).toMatch(/invalid/i);
  });
  it("rejects a duplicate", () => {
    expect(validateDate("2026-06-20", ["2026-06-20"])).toMatch(/already/i);
  });
});
