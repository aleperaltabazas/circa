export type Era = "prehistory" | "ancient" | "medieval" | "modern" | "recent";

export type Bucket = "perfect" | "green" | "lime" | "yellow" | "orange" | "red";

export type Puzzle = {
  id: string;
  era: Era;
  answer: number;
  hints: [string, string, string, string, string];
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
