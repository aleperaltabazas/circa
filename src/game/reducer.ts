import { GameState, Puzzle } from "./types";
import { scoreGuess } from "./scoring";

export type Action = { type: "submitGuess"; year: number; currentYear: number };

export function initialState(puzzle: Puzzle): GameState {
  return { puzzle, guesses: [], outcome: "playing", hintsRevealed: 1 };
}

export function reducer(state: GameState, action: Action): GameState {
  if (state.outcome !== "playing") return state;
  if (action.type !== "submitGuess") return state;

  const { distanceRatio, bucket } = scoreGuess(
    action.year,
    state.puzzle.answer,
    state.puzzle.era,
    action.currentYear,
  );
  const guesses = [...state.guesses, { year: action.year, distanceRatio, bucket }];

  if (bucket === "perfect") {
    return { ...state, guesses, outcome: "won", hintsRevealed: state.hintsRevealed };
  }
  if (guesses.length >= 5) {
    return { ...state, guesses, outcome: "lost", hintsRevealed: 5 };
  }
  return { ...state, guesses, hintsRevealed: Math.min(state.hintsRevealed + 1, 5) };
}
