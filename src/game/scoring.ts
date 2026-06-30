import { Answer, Bucket, Direction, Era, isPointAnswer } from "./types";
import { eraRange } from "./eras";

// Non-perfect bucket thresholds, evaluated in order: first ratio <= max wins.
// Anything beyond the last threshold falls through to "far".
const THRESHOLDS: { bucket: Exclude<Bucket, "perfect">; max: number }[] = [
  { bucket: "close", max: 0.05 },
  { bucket: "mid", max: 0.25 },
];

export function answerRange(
  answer: Answer,
  era: Era,
  currentYear: number,
): { from: number; to: number } {
  if (!isPointAnswer(answer)) return answer;
  if (!answer.margin) return { from: answer.year, to: answer.year };
  const { width } = eraRange(era, currentYear);
  const delta = Math.floor(width * answer.margin / 100);
  return { from: answer.year - delta, to: answer.year + delta };
}

export function distanceToRange(guess: number, range: { from: number; to: number }): number {
  if (guess >= range.from && guess <= range.to) return 0;
  return Math.min(Math.abs(guess - range.from), Math.abs(guess - range.to));
}

function directionOf(guess: number, range: { from: number; to: number }): Direction {
  if (guess >= range.from && guess <= range.to) return "match";
  return guess < range.from ? "later" : "earlier";
}

export function scoreGuess(
  guess: number,
  answer: Answer,
  era: Era,
  currentYear: number,
): { distanceRatio: number; bucket: Bucket; direction: Direction } {
  const { width } = eraRange(era, currentYear);
  const range = answerRange(answer, era, currentYear);
  const d = distanceToRange(guess, range);
  const distanceRatio = Math.min(d / width, 1);
  const direction = directionOf(guess, range);

  if (d === 0) return { distanceRatio: 0, bucket: "perfect", direction };
  for (const { bucket, max } of THRESHOLDS) {
    if (distanceRatio <= max) return { distanceRatio, bucket, direction };
  }
  return { distanceRatio, bucket: "far", direction };
}
