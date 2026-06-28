import { describe, it, expect } from "vitest";
import { reducer, initialState } from "../reducer";
import { Puzzle } from "../types";

const lepanto: Puzzle = {
  id: "lepanto-1571",
  era: "modern",
  answer: { from: 1571, to: 1571 },
  hints: { es: ["h1", "h2", "h3", "h4", "h5"] },
  description: { es: "desc" },
};

describe("initialState", () => {
  it("starts with one hint revealed and no guesses", () => {
    expect(initialState(lepanto)).toEqual({
      puzzle: lepanto,
      guesses: [],
      outcome: "playing",
      hintsRevealed: 1,
    });
  });
});

describe("reducer", () => {
  it("appends a wrong guess and reveals the next hint", () => {
    const next = reducer(initialState(lepanto), {
      type: "submitGuess",
      year: 1500,
      currentYear: 2026,
    });
    expect(next.guesses).toHaveLength(1);
    expect(next.guesses[0].year).toBe(1500);
    expect(next.guesses[0].bucket).toBe("mid");
    expect(next.guesses[0].direction).toBe("later");
    expect(next.hintsRevealed).toBe(2);
    expect(next.outcome).toBe("playing");
  });

  it("sets outcome to won on an exact guess", () => {
    const next = reducer(initialState(lepanto), {
      type: "submitGuess",
      year: 1571,
      currentYear: 2026,
    });
    expect(next.outcome).toBe("won");
    expect(next.guesses[0].bucket).toBe("perfect");
    expect(next.guesses[0].direction).toBe("match");
  });

  it("reveals all hints when the player wins early", () => {
    // Win on guess 2: one wrong guess (revealing hint 2), then the correct year.
    let state = initialState(lepanto);
    state = reducer(state, {
      type: "submitGuess",
      year: 1500,
      currentYear: 2026,
    });
    expect(state.hintsRevealed).toBe(2);
    state = reducer(state, {
      type: "submitGuess",
      year: 1571,
      currentYear: 2026,
    });
    expect(state.outcome).toBe("won");
    expect(state.hintsRevealed).toBe(5);
  });

  it("sets outcome to lost after the 5th wrong guess", () => {
    let state = initialState(lepanto);
    for (const y of [1500, 1600, 1700, 1455, 1788]) {
      state = reducer(state, {
        type: "submitGuess",
        year: y,
        currentYear: 2026,
      });
    }
    expect(state.guesses).toHaveLength(5);
    expect(state.outcome).toBe("lost");
  });

  it("ignores further guesses after the game ends", () => {
    let state = initialState(lepanto);
    state = reducer(state, {
      type: "submitGuess",
      year: 1571,
      currentYear: 2026,
    });
    const after = reducer(state, {
      type: "submitGuess",
      year: 1500,
      currentYear: 2026,
    });
    expect(after).toBe(state);
  });

  it("caps hintsRevealed at 5", () => {
    let state = initialState(lepanto);
    for (const y of [1500, 1600, 1700, 1455]) {
      state = reducer(state, {
        type: "submitGuess",
        year: y,
        currentYear: 2026,
      });
    }
    expect(state.hintsRevealed).toBe(5);
  });
});
