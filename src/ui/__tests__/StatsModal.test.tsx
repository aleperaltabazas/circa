import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatsModal } from "../StatsModal";
import { GameState, Stats } from "../../game/types";

const stats: Stats = { currentStreak: 3, maxStreak: 7, lastWinDate: "2026-06-20" };

const wonState: GameState = {
  puzzle: {
    id: "lepanto-1571",
    era: "modern",
    answer: { from: 1571, to: 1571 },
    hints: { es: ["a", "b", "c", "d", "e"], en: ["a", "b", "c", "d", "e"] },
    description: { es: "desc", en: "desc" },
  },
  guesses: [
    { year: 1500, distanceRatio: 0.21, bucket: "mid", direction: "later" },
    { year: 1571, distanceRatio: 0, bucket: "perfect", direction: "match" },
  ],
  outcome: "won",
  hintsRevealed: 2,
};

const lostState: GameState = { ...wonState, outcome: "lost" };

describe("StatsModal", () => {
  it("renders Spanish localized strings for a win", () => {
    render(
      <StatsModal
        stats={stats}
        gameState={wonState}
        puzzleNumber={42}
        url="https://example.com/circa/"
        locale="es"
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Ganaste en 2/5")).toBeInTheDocument();
    expect(screen.getByText("Actual")).toBeInTheDocument();
    expect(screen.getByText("Máxima")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cerrar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /compartir/i })).toBeInTheDocument();
  });

  it("renders English localized strings for a loss", () => {
    render(
      <StatsModal
        stats={stats}
        gameState={lostState}
        puzzleNumber={42}
        url="https://example.com/circa/"
        locale="en"
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/Game over — the answer was 1571/)).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByText("Max")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /share/i })).toBeInTheDocument();
  });

  it("renders the en-dash for a range answer on loss", () => {
    const rangeState = {
      ...lostState,
      puzzle: { ...lostState.puzzle, answer: { from: 1789, to: 1799 } },
    };
    render(
      <StatsModal
        stats={stats}
        gameState={rangeState}
        puzzleNumber={42}
        url="https://example.com/circa/"
        locale="en"
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/the answer was 1789–1799/)).toBeInTheDocument();
  });

  it("calls onClose when overlay is clicked", async () => {
    const onClose = vi.fn();
    const { container } = render(
      <StatsModal
        stats={stats}
        gameState={wonState}
        puzzleNumber={42}
        url="https://example.com/circa/"
        locale="es"
        onClose={onClose}
      />,
    );
    const overlay = container.firstChild as HTMLElement;
    await userEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });
});
