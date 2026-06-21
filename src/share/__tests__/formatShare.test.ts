import { describe, it, expect } from "vitest";
import { formatShare } from "../formatShare";
import { GameState } from "../../game/types";

const baseWin: GameState = {
  puzzle: {
    id: "lepanto-1571",
    era: "modern",
    answer: { from: 1571, to: 1571 },
    hints: { es: ["a","b","c","d","e"], en: ["a","b","c","d","e"] },
    description: { es: "desc", en: "desc" },
  },
  guesses: [
    { year: 1500, distanceRatio: 0.21, bucket: "orange", direction: "later" },
    { year: 1600, distanceRatio: 0.08, bucket: "yellow", direction: "earlier" },
    { year: 1571, distanceRatio: 0, bucket: "perfect", direction: "match" },
  ],
  outcome: "won",
  hintsRevealed: 3,
};

const baseLoss: GameState = {
  ...baseWin,
  guesses: [
    { year: 1500, distanceRatio: 0.21, bucket: "orange", direction: "later" },
    { year: 1600, distanceRatio: 0.08, bucket: "yellow", direction: "earlier" },
    { year: 1700, distanceRatio: 0.38, bucket: "orange", direction: "earlier" },
    { year: 1455, distanceRatio: 0.34, bucket: "orange", direction: "later" },
    { year: 1755, distanceRatio: 0.54, bucket: "red", direction: "earlier" },
  ],
  outcome: "lost",
};

describe("formatShare", () => {
  it("formats a win in Spanish", () => {
    expect(formatShare(baseWin, 42, "https://example.com/circa/", "es")).toBe(
      "Circa #42 — 3/5 🟧🟨✅\njugá en https://example.com/circa/",
    );
  });

  it("formats a loss in Spanish", () => {
    expect(formatShare(baseLoss, 42, "https://example.com/circa/", "es")).toBe(
      "Circa #42 — X/5 🟧🟨🟧🟧🟥\njugá en https://example.com/circa/",
    );
  });

  it("formats a win in English", () => {
    expect(formatShare(baseWin, 42, "https://example.com/circa/", "en")).toBe(
      "Circa #42 — 3/5 🟧🟨✅\nplay at https://example.com/circa/",
    );
  });

  it("formats a loss in English", () => {
    expect(formatShare(baseLoss, 42, "https://example.com/circa/", "en")).toBe(
      "Circa #42 — X/5 🟧🟨🟧🟧🟥\nplay at https://example.com/circa/",
    );
  });
});
