import { describe, it, expect } from "vitest";
import { puzzleNumberFor } from "../puzzleNumber";

describe("puzzleNumberFor", () => {
  it("returns 1 for the earliest scheduled date", () => {
    const schedule = { "2026-06-19": "a", "2026-06-20": "b", "2026-06-21": "c" };
    expect(puzzleNumberFor("2026-06-19", schedule)).toBe(1);
  });

  it("returns the 1-based index in chronological order", () => {
    const schedule = { "2026-06-21": "c", "2026-06-19": "a", "2026-06-20": "b" };
    expect(puzzleNumberFor("2026-06-21", schedule)).toBe(3);
  });

  it("returns null when date is not in schedule", () => {
    const schedule = { "2026-06-19": "a" };
    expect(puzzleNumberFor("2026-06-20", schedule)).toBeNull();
  });
});
