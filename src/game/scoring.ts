import { Bucket, Era } from "./types";
import { eraRange } from "./eras";

const THRESHOLDS: { bucket: Bucket; max: number }[] = [
  { bucket: "perfect", max: 0 },
  { bucket: "green", max: 0.01 },
  { bucket: "lime", max: 0.05 },
  { bucket: "yellow", max: 0.15 },
  { bucket: "orange", max: 0.40 },
];

export function scoreGuess(
  guess: number,
  answer: number,
  era: Era,
  currentYear: number,
): { distanceRatio: number; bucket: Bucket } {
  const { width } = eraRange(era, currentYear);
  const d = Math.abs(guess - answer);
  const distanceRatio = Math.min(d / width, 1);

  if (d === 0) return { distanceRatio: 0, bucket: "perfect" };
  for (const { bucket, max } of THRESHOLDS) {
    if (bucket !== "perfect" && distanceRatio <= max) return { distanceRatio, bucket };
  }
  return { distanceRatio, bucket: "red" };
}
