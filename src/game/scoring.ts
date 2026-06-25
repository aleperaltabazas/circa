import { Bucket, Direction, Era, YearRange } from "./types";
import { eraRange } from "./eras";

// Non-perfect bucket thresholds, evaluated in order: first ratio <= max wins.
// Anything beyond the last threshold falls through to "far".
const THRESHOLDS: { bucket: Exclude<Bucket, "perfect">; max: number }[] = [
  { bucket: "close", max: 0.05 },
  { bucket: "mid", max: 0.25 },
];

function distanceToRange(guess: number, answer: YearRange): number {
  if (guess >= answer.from && guess <= answer.to) return 0;
  return Math.min(Math.abs(guess - answer.from), Math.abs(guess - answer.to));
}

function directionOf(guess: number, answer: YearRange): Direction {
  if (guess >= answer.from && guess <= answer.to) return "match";
  return guess < answer.from ? "later" : "earlier";
}

export function scoreGuess(
  guess: number,
  answer: YearRange,
  era: Era,
  currentYear: number,
): { distanceRatio: number; bucket: Bucket; direction: Direction } {
  const { width } = eraRange(era, currentYear);
  const d = distanceToRange(guess, answer);
  const distanceRatio = Math.min(d / width, 1);
  const direction = directionOf(guess, answer);

  if (d === 0) return { distanceRatio: 0, bucket: "perfect", direction };
  for (const { bucket, max } of THRESHOLDS) {
    if (distanceRatio <= max) return { distanceRatio, bucket, direction };
  }
  return { distanceRatio, bucket: "far", direction };
}
