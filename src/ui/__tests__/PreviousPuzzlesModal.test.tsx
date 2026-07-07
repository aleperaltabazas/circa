import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PreviousPuzzlesModal } from "../PreviousPuzzlesModal";
import { GameState } from "../../game/types";

function stateWith(outcome: GameState["outcome"], guessCount: number): GameState {
  return {
    puzzle: { answer: { year: 1978 } } as GameState["puzzle"],
    guesses: Array(guessCount).fill({ year: 2000, bucket: "far", distanceRatio: 1, direction: "later" }),
    outcome,
    hintsRevealed: 1,
  };
}

const dates = ["2026-07-03", "2026-07-04", "2026-07-05", "2026-07-06"];
const history: Record<string, GameState> = {
  "2026-07-06": stateWith("won", 2),
  "2026-07-05": stateWith("lost", 5),
  "2026-07-04": stateWith("playing", 1),
};

describe("PreviousPuzzlesModal", () => {
  it("renders the date as day/month for every card", () => {
    render(
      <PreviousPuzzlesModal dates={dates} history={history} locale="es" onSelect={() => {}} onClose={() => {}} />,
    );
    expect(screen.getByText("03/07")).toBeInTheDocument();
    expect(screen.getByText("06/07")).toBeInTheDocument();
  });

  it("shows the status icon and revealed answer year for a won puzzle", () => {
    render(
      <PreviousPuzzlesModal dates={dates} history={history} locale="es" onSelect={() => {}} onClose={() => {}} />,
    );
    const card = screen.getByText("06/07").closest("button")!;
    expect(card).toHaveTextContent("✅");
    expect(card).toHaveTextContent("1978");
  });

  it("shows the status icon and revealed answer year for a lost puzzle", () => {
    render(
      <PreviousPuzzlesModal dates={dates} history={history} locale="es" onSelect={() => {}} onClose={() => {}} />,
    );
    const card = screen.getByText("05/07").closest("button")!;
    expect(card).toHaveTextContent("❌");
    expect(card).toHaveTextContent("1978");
  });

  it("shows the in-progress icon without an answer year for an unfinished puzzle", () => {
    render(
      <PreviousPuzzlesModal dates={dates} history={history} locale="es" onSelect={() => {}} onClose={() => {}} />,
    );
    const card = screen.getByText("04/07").closest("button")!;
    expect(card).toHaveTextContent("🕓");
    expect(card).not.toHaveTextContent("1978");
  });

  it("shows a dash icon and no year, for a not-started puzzle", () => {
    render(
      <PreviousPuzzlesModal dates={dates} history={history} locale="es" onSelect={() => {}} onClose={() => {}} />,
    );
    const card = screen.getByText("03/07").closest("button")!;
    expect(card).toHaveTextContent("➖");
    expect(card).not.toHaveTextContent("✅");
    expect(card).not.toHaveTextContent("❌");
    expect(card).not.toHaveTextContent("🕓");
    expect(card).not.toHaveTextContent("1978");
  });

  it("calls onSelect with the matching date when a card is clicked", async () => {
    const onSelect = vi.fn();
    render(
      <PreviousPuzzlesModal dates={dates} history={history} locale="es" onSelect={onSelect} onClose={() => {}} />,
    );
    await userEvent.click(screen.getByText("06/07"));
    expect(onSelect).toHaveBeenCalledWith("2026-07-06");
  });

  it("calls onClose when the overlay is clicked", async () => {
    const onClose = vi.fn();
    const { container } = render(
      <PreviousPuzzlesModal dates={dates} history={history} locale="es" onSelect={() => {}} onClose={onClose} />,
    );
    await userEvent.click(container.firstChild as HTMLElement);
    expect(onClose).toHaveBeenCalled();
  });
});
