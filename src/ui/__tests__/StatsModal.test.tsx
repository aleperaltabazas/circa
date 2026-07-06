import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatsModal } from "../StatsModal";
import { GameState, Stats } from "../../game/types";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

const stats: Stats = { currentStreak: 3, maxStreak: 7, lastWinDate: "2026-06-20" };

const wonState: GameState = {
  puzzle: {
    id: "lepanto-1571",
    era: "modern",
    par: 3,
    answer: { year: 1571 },
    hints: { es: ["a", "b", "c", "d", "e"] },
    description: { es: "desc" },
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
        puzzle={wonState.puzzle}
        puzzleNumber={42}
        currentYear={2026}
        url="https://example.com/circa/"
        locale="es"
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("¡Lo lograste!")).toBeInTheDocument();
    expect(screen.getByText("en 2/5")).toBeInTheDocument();
    expect(screen.getByText("Actual")).toBeInTheDocument();
    expect(screen.getByText("Máxima")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cerrar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /compartir/i })).toBeInTheDocument();
  });

  it("renders Spanish localized strings for a loss", () => {
    render(
      <StatsModal
        stats={stats}
        gameState={lostState}
        puzzle={lostState.puzzle}
        puzzleNumber={42}
        currentYear={2026}
        url="https://example.com/circa/"
        locale="es"
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Te quedaste sin intentos")).toBeInTheDocument();
    expect(screen.getByText(/La respuesta era 1571/)).toBeInTheDocument();
    expect(screen.getByText("Actual")).toBeInTheDocument();
    expect(screen.getByText("Máxima")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cerrar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /compartir/i })).toBeInTheDocument();
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
        puzzle={rangeState.puzzle}
        puzzleNumber={42}
        currentYear={2026}
        url="https://example.com/circa/"
        locale="es"
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/La respuesta era 1789–1799/)).toBeInTheDocument();
  });

  it("calls onClose when overlay is clicked", async () => {
    const onClose = vi.fn();
    const { container } = render(
      <StatsModal
        stats={stats}
        gameState={wonState}
        puzzle={wonState.puzzle}
        puzzleNumber={42}
        currentYear={2026}
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
