import { Answer, isPointAnswer } from "../game/types";

export function formatAnswer(a: Answer): string {
  return isPointAnswer(a) ? String(a.year) : `${a.from}–${a.to}`;
}
