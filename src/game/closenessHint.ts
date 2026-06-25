export type HintKey =
  | "tooFar"
  | "close"
  | "veryClose"
  | "soClose"
  | "closer"
  | "wentTooFar";

/**
 * Compute the closeness-hint key for a guess.
 *
 * Priorities:
 *  1. If d/W < 3% → "soClose" (override regardless of trend).
 *  2. Otherwise, if there is a previous distance AND it differs from d → trend hint.
 *  3. First guess OR same distance as previous → absolute bucket label.
 */
export function closenessHintKey(d: number, prevD: number | null, W: number): HintKey {
  const ratio = d / W;
  if (ratio < 0.03) return "soClose";
  if (prevD !== null && d < prevD) return "closer";
  if (prevD !== null && d > prevD) return "wentTooFar";
  if (ratio <= 0.05) return "veryClose";
  if (ratio <= 0.25) return "close";
  return "tooFar";
}
