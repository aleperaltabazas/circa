import { Puzzle, Schedule } from "./types";

export function selectPuzzle(todayIso: string, schedule: Schedule, puzzles: Puzzle[]): Puzzle | null {
  const id = schedule[todayIso];
  if (!id) return null;
  return puzzles.find((p) => p.id === id) ?? null;
}
