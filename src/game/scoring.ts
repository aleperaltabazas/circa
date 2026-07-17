import { Answer, Bucket, Direction, Era, NamedMargin, isPointAnswer } from "./types";
import { eraRange } from "./eras";

const PERIOD_SIZES: Record<NamedMargin, number> = { luster: 5, decade: 10, century: 100, millennium: 1000 };

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
  if (typeof answer.margin === "string") {
    const size = PERIOD_SIZES[answer.margin];
    const start = Math.floor(answer.year / size) * size;
    const { from: eraFrom, to: eraTo } = eraRange(era, currentYear);
    return { from: Math.max(start, eraFrom), to: Math.min(start + size - 1, eraTo - 1) };
  }
  const { from: eraFrom, to: eraTo, width } = eraRange(era, currentYear);
  const delta = Math.floor(width * answer.margin);
  return { from: Math.max(answer.year - delta, eraFrom), to: Math.min(answer.year + delta, eraTo) };
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
