import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Board } from "../Board";
import { GameState } from "../../game/types";

const state: GameState = {
  puzzle: {
    id: "lepanto-1571",
    era: "modern",
    par: 3,
    answer: { year: 1571 },
    hints: { es: ["a", "b", "c", "d", "e"] },
    description: { es: "desc" },
  },
  guesses: [],
  outcome: "playing",
  hintsRevealed: 1,
};

describe("Board", () => {
  it("renders a button to view previous puzzles", () => {
    render(
      <Board
        state={state}
        puzzleNumber={42}
        todayLabel="2026-07-07"
        currentYear={2026}
        locale="es"
        onLocaleChange={() => {}}
        onHelpClick={() => {}}
        onOpenPrevious={() => {}}
        onGuess={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /ver puzzles anteriores/i })).toBeInTheDocument();
  });

  it("calls onOpenPrevious when the button is clicked", async () => {
    const onOpenPrevious = vi.fn();
    render(
      <Board
        state={state}
        puzzleNumber={42}
        todayLabel="2026-07-07"
        currentYear={2026}
        locale="es"
        onLocaleChange={() => {}}
        onHelpClick={() => {}}
        onOpenPrevious={onOpenPrevious}
        onGuess={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /ver puzzles anteriores/i }));
    expect(onOpenPrevious).toHaveBeenCalled();
  });
});
