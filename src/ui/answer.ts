import { YearRange } from "../game/types";

export function formatAnswer(a: YearRange): string {
  return a.from === a.to ? String(a.from) : `${a.from}–${a.to}`;
}
