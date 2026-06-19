import { Schedule } from "./types";

export function puzzleNumberFor(todayIso: string, schedule: Schedule): number | null {
  const sortedDates = Object.keys(schedule).sort();
  const index = sortedDates.indexOf(todayIso);
  return index === -1 ? null : index + 1;
}
