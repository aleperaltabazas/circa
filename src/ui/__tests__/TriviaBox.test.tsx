import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TriviaBox } from "../TriviaBox";
import { GameState, Puzzle } from "../../game/types";

const puzzle: Puzzle = {
  id: "lepanto-1571",
  era: "modern",
  answer: { from: 1571, to: 1571 },
  hints: { es: ["a","b","c","d","e"] },
  description: {
    es: "Descripción en español sobre Lepanto.",
  },
};

const gameState: GameState = {
  puzzle,
  guesses: [{ year: 1571, distanceRatio: 0, bucket: "perfect", direction: "match" }],
  outcome: "won",
  hintsRevealed: 1,
};

describe("TriviaBox", () => {
  it("renders the Spanish title, description, formatted answer, and Share button", () => {
    render(
      <TriviaBox
        puzzle={puzzle}
        gameState={gameState}
        puzzleNumber={1}
        url="https://example.com/circa/"
        locale="es"
      />,
    );
    expect(screen.getByText("Sobre este puzzle")).toBeInTheDocument();
    expect(screen.getByText("Descripción en español sobre Lepanto.")).toBeInTheDocument();
    expect(screen.getByText("1571")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /compartir/i })).toBeInTheDocument();
  });

  it("renders a range answer with the en-dash", () => {
    const rangePuzzle: Puzzle = { ...puzzle, answer: { from: 1789, to: 1799 } };
    render(
      <TriviaBox
        puzzle={rangePuzzle}
        gameState={{ ...gameState, puzzle: rangePuzzle }}
        puzzleNumber={1}
        url="https://example.com/circa/"
        locale="es"
      />,
    );
    expect(screen.getByText("1789–1799")).toBeInTheDocument();
  });
});
