import { describe, it, expect } from "vitest";
import { formatShare } from "../formatShare";
import { GameState } from "../../game/types";

const winState: GameState = {
  puzzle: { id: "lepanto-1571", era: "modern", answer: 1571, hints: ["a", "b", "c", "d", "e"] },
  guesses: [
    { year: 1500, distanceRatio: 0.21, bucket: "orange" },
    { year: 1600, distanceRatio: 0.08, bucket: "yellow" },
    { year: 1571, distanceRatio: 0, bucket: "perfect" },
  ],
  outcome: "won",
  hintsRevealed: 3,
};

const lossState: GameState = {
  ...winState,
  guesses: [
    { year: 1500, distanceRatio: 0.21, bucket: "orange" },
    { year: 1600, distanceRatio: 0.08, bucket: "yellow" },
    { year: 1700, distanceRatio: 0.38, bucket: "orange" },
    { year: 1455, distanceRatio: 0.34, bucket: "orange" },
    { year: 1755, distanceRatio: 0.54, bucket: "red" },
  ],
  outcome: "lost",
};

describe("formatShare", () => {
  it("formats a win", () => {
    expect(formatShare(winState, 42, "https://example.com/daily-year/")).toBe(
      "Daily Year #42 — 3/5 🟧🟨🟡\nplay at https://example.com/daily-year/",
    );
  });

  it("formats a loss with X/5", () => {
    expect(formatShare(lossState, 42, "https://example.com/daily-year/")).toBe(
      "Daily Year #42 — X/5 🟧🟨🟧🟧🟥\nplay at https://example.com/daily-year/",
    );
  });
});
