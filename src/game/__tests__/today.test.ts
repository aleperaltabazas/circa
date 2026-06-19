import { describe, it, expect } from "vitest";
import { today, currentYearArt } from "../today";

describe("today", () => {
  it("returns YYYY-MM-DD for a given UTC instant in Buenos Aires time", () => {
    // 2026-06-19 02:00 UTC == 2026-06-18 23:00 ART
    expect(today(new Date("2026-06-19T02:00:00Z"))).toBe("2026-06-18");
  });

  it("returns the next day after midnight ART", () => {
    // 2026-06-19 04:00 UTC == 2026-06-19 01:00 ART
    expect(today(new Date("2026-06-19T04:00:00Z"))).toBe("2026-06-19");
  });
});

describe("currentYearArt", () => {
  it("returns the 4-digit year", () => {
    expect(currentYearArt(new Date("2026-06-19T12:00:00Z"))).toBe(2026);
  });
});
