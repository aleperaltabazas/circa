import { Locale } from "../i18n/types";

export type Era = "prehistory" | "ancient" | "medieval" | "modern" | "recent";

export type Bucket = "perfect" | "close" | "mid" | "far";

export type Direction = "earlier" | "later" | "match";

export type NamedMargin = "luster" | "decade" | "century" | "millennium";
export type Margin = number | NamedMargin;

export type PointAnswer = { year: number; margin?: Margin };
export type SpanAnswer  = { from: number; to: number };
export type Answer = PointAnswer | SpanAnswer;

export function isPointAnswer(a: Answer): a is PointAnswer { return "year" in a; }

export type Par = 1 | 2 | 3 | 4 | 5;

export type Puzzle = {
  id: string;
  era: Era;
  answer: Answer;
  par: Par;
  hints: Record<Locale, [string, string, string, string, string]>;
  description: Record<Locale, string>;
  dateAnchored?: boolean;
};

export type Schedule = Record<string, string>;

export type Guess = {
  year: number;
  bucket: Bucket;
  distanceRatio: number;
  direction: Direction;
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
