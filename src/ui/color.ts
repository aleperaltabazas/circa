import { Bucket, Guess } from "../game/types";

const COLORS: Record<Bucket, string> = {
  perfect: "#15803d",
  close: "#22c55e",
  mid: "#eab308",
  far: "#ef4444",
};

export function colorFor(guess: Guess): string {
  return COLORS[guess.bucket];
}
