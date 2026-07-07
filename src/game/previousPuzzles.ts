import { GameState, Schedule } from "./types";

export type PuzzleStatus = "won" | "lost" | "inProgress" | "notStarted";

function subtractDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

export function previousPuzzleDates(todayIso: string, schedule: Schedule, days = 7): string[] {
  const result: string[] = [];
  for (let i = 1; i <= days; i++) {
    const candidate = subtractDays(todayIso, i);
    if (candidate in schedule) result.push(candidate);
  }
  return result;
}

export function statusFor(date: string, history: Record<string, GameState>): PuzzleStatus {
  const entry = history[date];
  if (!entry) return "notStarted";
  if (entry.outcome === "won") return "won";
  if (entry.outcome === "lost") return "lost";
  if (entry.guesses.length > 0) return "inProgress";
  return "notStarted";
}
