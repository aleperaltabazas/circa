import { describe, it, expect } from "vitest";
import {
  validateId,
  validateYearInEra,
  validateAnswerRange,
  validateNonEmpty,
  validateDate,
  eraOf,
  validateYearHasEra,
  validateSameEraRange,
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

describe("eraOf", () => {
  it("returns prehistory for a BCE deep-past year", () => {
    expect(eraOf(-2000)).toBe("prehistory");
  });
  it("returns ancient for a year in classical antiquity", () => {
    expect(eraOf(-100)).toBe("ancient");
  });
  it("returns medieval for a year in the middle ages", () => {
    expect(eraOf(1000)).toBe("medieval");
  });
  it("returns modern for a year in the early modern period", () => {
    expect(eraOf(1571)).toBe("modern");
  });
  it("returns recent for a year after 1789", () => {
    expect(eraOf(1986)).toBe("recent");
  });
  it("treats the lower boundary as inclusive", () => {
    expect(eraOf(1453)).toBe("modern");
    expect(eraOf(1789)).toBe("recent");
    expect(eraOf(476)).toBe("medieval");
  });
  it("returns null for years before the earliest era", () => {
    expect(eraOf(-3001)).toBeNull();
  });
  it("returns null for non-integers", () => {
    expect(eraOf(1986.5)).toBeNull();
  });
});

describe("validateYearHasEra", () => {
  it("accepts a year in a known era", () => {
    expect(validateYearHasEra(1986)).toBeNull();
  });
  it("rejects a year outside any era", () => {
    expect(validateYearHasEra(-5000)).toMatch(/outside/i);
  });
  it("rejects a non-integer", () => {
    expect(validateYearHasEra(1986.5)).toMatch(/integer/i);
  });
});

describe("validateSameEraRange", () => {
  it("accepts from === to in a known era", () => {
    expect(validateSameEraRange(1571, 1571)).toBeNull();
  });
  it("accepts a range entirely within one era", () => {
    expect(validateSameEraRange(1789, 1799)).toBeNull();
  });
  it("rejects from > to", () => {
    expect(validateSameEraRange(1800, 1789)).toMatch(/from.*to/i);
  });
  it("rejects a range that spans two eras", () => {
    const msg = validateSameEraRange(1750, 1850);
    expect(msg).toMatch(/spans two eras/i);
    expect(msg).toMatch(/modern/);
    expect(msg).toMatch(/recent/);
  });
  it("rejects when either endpoint is outside any era", () => {
    expect(validateSameEraRange(-5000, -4000)).toMatch(/outside/i);
  });
});
