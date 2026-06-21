import { Locale } from "../i18n/types";

export type Era = "prehistory" | "ancient" | "medieval" | "modern" | "recent";

export type Bucket = "perfect" | "green" | "lime" | "yellow" | "orange" | "red";

export type YearRange = { from: number; to: number };

export type Puzzle = {
  id: string;
  era: Era;
  answer: YearRange;
  hints: Record<Locale, [string, string, string, string, string]>;
};

export type Schedule = Record<string, string>;

export type Guess = {
  year: number;
  bucket: Bucket;
  distanceRatio: number;
};

export type Outcome = "playing" | "won" | "lost";

export type GameState = {
  puzzle: Puzzle;
  guesses: Guess[];
  outcome: Outcome;
  hintsRevealed: number;
};

export type Stats = {
  currentStreak: number;
  maxStreak: number;
  lastWinDate: string | null;
};
