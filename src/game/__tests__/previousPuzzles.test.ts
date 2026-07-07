import { describe, it, expect } from "vitest";
import { previousPuzzleDates, statusFor } from "../previousPuzzles";
import { GameState, Schedule } from "../types";

const schedule: Schedule = {
  "2026-06-28": "a",
  "2026-06-29": "b",
  "2026-06-30": "c",
  "2026-07-01": "d",
  "2026-07-02": "e",
  "2026-07-03": "f",
  "2026-07-04": "g",
  "2026-07-05": "h",
  "2026-07-06": "i",
  "2026-07-07": "j",
};

describe("previousPuzzleDates", () => {
  it("returns up to 7 dates strictly before today, most-recent-first", () => {
    expect(previousPuzzleDates("2026-07-07", schedule)).toEqual([
      "2026-07-06",
      "2026-07-05",
      "2026-07-04",
      "2026-07-03",
      "2026-07-02",
      "2026-07-01",
      "2026-06-30",
    ]);
  });

  it("filters out dates missing from the schedule", () => {
    const sparse: Schedule = {
      "2026-07-06": "a",
      "2026-07-03": "b",
    };
    expect(previousPuzzleDates("2026-07-07", sparse)).toEqual(["2026-07-06", "2026-07-03"]);
  });

  it("respects a custom days window", () => {
    expect(previousPuzzleDates("2026-07-07", schedule, 2)).toEqual(["2026-07-06", "2026-07-05"]);
  });
});

function stateWith(outcome: GameState["outcome"], guessCount: number): GameState {
  return {
    puzzle: {} as GameState["puzzle"],
    guesses: Array(guessCount).fill({ year: 2000, bucket: "far", distanceRatio: 1, direction: "later" }),
    outcome,
    hintsRevealed: 1,
  };
}

describe("statusFor", () => {
  it("returns notStarted when there is no history entry", () => {
    expect(statusFor("2026-07-01", {})).toBe("notStarted");
  });

  it("returns won when the entry's outcome is won", () => {
    const history = { "2026-07-01": stateWith("won", 2) };
    expect(statusFor("2026-07-01", history)).toBe("won");
  });

  it("returns lost when the entry's outcome is lost", () => {
    const history = { "2026-07-01": stateWith("lost", 5) };
    expect(statusFor("2026-07-01", history)).toBe("lost");
  });

  it("returns inProgress when playing with at least one guess", () => {
    const history = { "2026-07-01": stateWith("playing", 1) };
    expect(statusFor("2026-07-01", history)).toBe("inProgress");
  });

  it("returns notStarted when playing with zero guesses", () => {
    const history = { "2026-07-01": stateWith("playing", 0) };
    expect(statusFor("2026-07-01", history)).toBe("notStarted");
  });
});
