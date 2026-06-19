import { Guess } from "../game/types";

export function colorFor(guess: Guess): string {
  if (guess.bucket === "perfect") return "hsl(45, 90%, 55%)";
  const hue = 120 * (1 - guess.distanceRatio);
  return `hsl(${hue}, 65%, 50%)`;
}
