import { describe, it, expect } from "vitest";
import { formatShare } from "../formatShare";
import { GameState } from "../../game/types";

const baseWin: GameState = {
  puzzle: {
    id: "lepanto-1571",
    era: "modern",
    par: 3,
    answer: { from: 1571, to: 1571 },
    hints: { es: ["a", "b", "c", "d", "e"] },
    description: { es: "desc" },
  },
  guesses: [
    { year: 1500, distanceRatio: 0.21, bucket: "mid", direction: "later" },
    { year: 1600, distanceRatio: 0.08, bucket: "mid", direction: "earlier" },
    { year: 1571, distanceRatio: 0, bucket: "perfect", direction: "match" },
  ],
  outcome: "won",
  hintsRevealed: 3,
};

const baseLoss: GameState = {
  ...baseWin,
  guesses: [
    { year: 1500, distanceRatio: 0.21, bucket: "mid", direction: "later" },
    { year: 1600, distanceRatio: 0.08, bucket: "mid", direction: "earlier" },
    { year: 1700, distanceRatio: 0.38, bucket: "far", direction: "earlier" },
    { year: 1455, distanceRatio: 0.34, bucket: "far", direction: "later" },
    { year: 1755, distanceRatio: 0.54, bucket: "far", direction: "earlier" },
  ],
  outcome: "lost",
};

describe("formatShare", () => {
  it("formats a win in Spanish", () => {
    expect(formatShare(baseWin, 42, "https://example.com/circa/", "es")).toBe(
      "Circa #42 — 3/5 🟨🟨✅\nhttps://example.com/circa/",
    );
  });

  it("formats a loss in Spanish", () => {
    expect(formatShare(baseLoss, 42, "https://example.com/circa/", "es")).toBe(
      "Circa #42 — X/5 🟨🟨🟥🟥🟥\nhttps://example.com/circa/",
    );
  });
});
