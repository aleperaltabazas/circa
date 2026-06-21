import { Bucket, Direction, Era, YearRange } from "./types";
import { eraRange } from "./eras";

const THRESHOLDS: { bucket: Bucket; max: number }[] = [
  { bucket: "perfect", max: 0 },
  { bucket: "green", max: 0.01 },
  { bucket: "lime", max: 0.05 },
  { bucket: "yellow", max: 0.15 },
  { bucket: "orange", max: 0.40 },
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
    if (bucket !== "perfect" && distanceRatio <= max) return { distanceRatio, bucket, direction };
  }
  return { distanceRatio, bucket: "red", direction };
}
