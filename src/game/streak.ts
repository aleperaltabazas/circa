import { Stats } from "./types";

function yesterdayIso(todayIso: string): string {
  const [y, m, d] = todayIso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function applyResult(stats: Stats, outcome: "won" | "lost", todayIso: string): Stats {
  if (outcome === "lost") {
    return { ...stats, currentStreak: 0 };
  }
  const extending = stats.lastWinDate === yesterdayIso(todayIso);
  const currentStreak = extending ? stats.currentStreak + 1 : 1;
  return {
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    lastWinDate: todayIso,
  };
}
