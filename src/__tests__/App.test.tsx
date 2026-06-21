import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";

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
    // Seed localStorage as if the user already finished today's puzzle
    const persisted = {
      schemaVersion: 3,
      lastPlayedDate: "2026-06-20",
      lastResult: {
        puzzle: {
          id: "lepanto-1571",
          era: "modern",
          answer: { from: 1571, to: 1571 },
          hints: {
            es: ["pista 1", "pista 2", "pista 3", "pista 4", "pista 5"],
            en: ["hint 1", "hint 2", "hint 3", "hint 4", "hint 5"],
          },
          description: { es: "desc es", en: "desc en" },
        },
        guesses: [{ year: 1571, bucket: "perfect", distanceRatio: 0, direction: "match" }],
        outcome: "won",
        hintsRevealed: 1,
      },
      stats: { currentStreak: 1, maxStreak: 1, lastWinDate: "2026-06-20" },
      locale: "es",
    };
    window.localStorage.setItem("circa", JSON.stringify(persisted));

    render(<App />);

    // TriviaBox heading must appear
    expect(await screen.findByText("Sobre este puzzle")).toBeInTheDocument();

    // StatsModal must NOT be open (no "Ganaste en N/5" text)
    expect(screen.queryByText(/Ganaste en/)).toBeNull();
  });
});

describe("App", () => {
  it("renders the board for today's puzzle in Spanish by default", async () => {
    render(<App />);
    expect(await screen.findByText(/Circa/i)).toBeInTheDocument();
    expect(screen.getByText("moderna")).toBeInTheDocument();
    expect(screen.getByText(/imperio otomano/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /adivinar/i })).toBeInTheDocument();
  });

  it("reveals the next hint after a wrong guess (Spanish)", async () => {
    render(<App />);
    await screen.findByText(/imperio otomano/i);
    await userEvent.type(screen.getByRole("spinbutton"), "1500");
    await userEvent.click(screen.getByRole("button", { name: /adivinar/i }));
    expect(screen.getByText(/imperio bizantino/i)).toBeInTheDocument();
    expect(screen.getByText("1500")).toBeInTheDocument();
  });

  it("switches the UI language when the locale toggle changes", async () => {
    render(<App />);
    await screen.findByText(/imperio otomano/i);
    await userEvent.selectOptions(screen.getByRole("combobox"), "en");
    expect(screen.getByText(/Ottoman empire/i)).toBeInTheDocument();
    expect(screen.getByText("modern")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /guess/i })).toBeInTheDocument();
  });

  it("shows both StatsModal and TriviaBox after finishing a fresh game", async () => {
    render(<App />);
    // Wait for board to load (Spanish hints)
    await screen.findByText(/imperio otomano/i);
    // Submit the correct year: 1571
    await userEvent.type(screen.getByRole("spinbutton"), "1571");
    await userEvent.click(screen.getByRole("button", { name: /adivinar/i }));
    // StatsModal auto-opens on fresh finish
    expect(await screen.findByText(/Ganaste en/)).toBeInTheDocument();
    // TriviaBox also visible
    expect(screen.getByText("Sobre este puzzle")).toBeInTheDocument();
  });
});
