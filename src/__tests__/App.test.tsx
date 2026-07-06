import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

beforeEach(() => {
  window.localStorage.clear();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-06-20T15:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("App – previously finished game (reload)", () => {
  it("shows TriviaBox but not StatsModal when reloading a finished game", async () => {
    const persisted = {
      schemaVersion: 4,
      lastPlayedDate: "2026-06-20",
      lastResult: {
        puzzle: {
          id: "lepanto-1571",
          era: "modern",
          answer: { year: 1571 },
          hints: {
            es: ["pista 1", "pista 2", "pista 3", "pista 4", "pista 5"],
          },
          description: { es: "desc es" },
        },
        guesses: [
          {
            year: 1571,
            bucket: "perfect",
            distanceRatio: 0,
            direction: "match",
          },
        ],
        outcome: "won",
        hintsRevealed: 1,
      },
      stats: { currentStreak: 1, maxStreak: 1, lastWinDate: "2026-06-20" },
      locale: "es",
    };
    window.localStorage.setItem("circa", JSON.stringify(persisted));

    render(<App />);

    expect(await screen.findByText("Sobre este puzzle")).toBeInTheDocument();
    // StatsModal must NOT be open (no win headline)
    expect(screen.queryByText("¡Lo lograste!")).toBeNull();
  });
});

describe("App", () => {
  it("renders the board for today's puzzle in Spanish by default", async () => {
    render(<App />);
    expect(await screen.findByText("Circa")).toBeInTheDocument();
    expect(screen.getByText("moderna")).toBeInTheDocument();
    expect(screen.getByText(/imperio otomano/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /adivinar/i }),
    ).toBeInTheDocument();
  });

  it("reveals the next hint after a wrong guess (Spanish)", async () => {
    render(<App />);
    await screen.findByText(/imperio otomano/i);
    await userEvent.type(screen.getByRole("spinbutton"), "1500");
    await userEvent.click(screen.getByRole("button", { name: /adivinar/i }));
    expect(screen.getByText(/imperio bizantino/i)).toBeInTheDocument();
    expect(screen.getByText("1500")).toBeInTheDocument();
  });

  it("shows StatsModal on finish, then TriviaBox after closing it", async () => {
    render(<App />);
    await screen.findByText(/imperio otomano/i);
    await userEvent.type(screen.getByRole("spinbutton"), "1571");
    await userEvent.click(screen.getByRole("button", { name: /adivinar/i }));
    // StatsModal auto-opens on fresh finish — TriviaBox hidden while modal is open
    expect(await screen.findByText("¡Lo lograste!")).toBeInTheDocument();
    expect(screen.queryByText("Sobre este puzzle")).not.toBeInTheDocument();
    // Close the modal — TriviaBox should now appear
    await userEvent.click(screen.getByRole("button", { name: /cerrar/i }));
    expect(screen.getByText("Sobre este puzzle")).toBeInTheDocument();
  });
});
