import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShareButton } from "../ShareButton";
import { GameState } from "../../game/types";

const state: GameState = {
  puzzle: {
    id: "lepanto-1571",
    era: "modern",
    answer: { from: 1571, to: 1571 },
    hints: { es: ["a","b","c","d","e"], en: ["a","b","c","d","e"] },
  },
  guesses: [
    { year: 1500, distanceRatio: 0.21, bucket: "orange", direction: "later" },
    { year: 1571, distanceRatio: 0, bucket: "perfect", direction: "match" },
  ],
  outcome: "won",
  hintsRevealed: 2,
};

describe("ShareButton", () => {
  it("copies the localized share string (Spanish)", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<ShareButton state={state} puzzleNumber={42} url="https://example.com/circa/" locale="es" />);
    await userEvent.click(screen.getByRole("button", { name: /compartir/i }));
    expect(writeText).toHaveBeenCalledWith(
      "Circa #42 — 2/5 🟧🟡\njugá en https://example.com/circa/",
    );
  });

  it("copies the localized share string (English)", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<ShareButton state={state} puzzleNumber={42} url="https://example.com/circa/" locale="en" />);
    await userEvent.click(screen.getByRole("button", { name: /share/i }));
    expect(writeText).toHaveBeenCalledWith(
      "Circa #42 — 2/5 🟧🟡\nplay at https://example.com/circa/",
    );
  });
});
