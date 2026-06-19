import { describe, it, expect } from "vitest";
import { selectPuzzle } from "../selectPuzzle";
import { Puzzle } from "../types";

const lepanto: Puzzle = {
  id: "lepanto-1571",
  era: "modern",
  answer: 1571,
  hints: ["a", "b", "c", "d", "e"],
};

const moonLanding: Puzzle = {
  id: "moon-landing-1969",
  era: "recent",
  answer: 1969,
  hints: ["a", "b", "c", "d", "e"],
};

describe("selectPuzzle", () => {
  it("returns the puzzle scheduled for today", () => {
    const schedule = { "2026-06-19": "lepanto-1571", "2026-06-20": "moon-landing-1969" };
    expect(selectPuzzle("2026-06-19", schedule, [lepanto, moonLanding])).toBe(lepanto);
  });

  it("returns null when today is not in the schedule", () => {
    const schedule = { "2026-06-19": "lepanto-1571" };
    expect(selectPuzzle("2026-06-20", schedule, [lepanto])).toBeNull();
  });

  it("returns null when the scheduled id has no matching puzzle", () => {
    const schedule = { "2026-06-19": "missing-id" };
    expect(selectPuzzle("2026-06-19", schedule, [lepanto])).toBeNull();
  });
});
