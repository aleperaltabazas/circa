import { GameState, Stats } from "../game/types";

const KEY = "circa";

export type PersistedShape = {
  schemaVersion: 1;
  lastPlayedDate: string | null;
  lastResult: GameState | null;
  stats: Stats;
};

export const EMPTY: PersistedShape = {
  schemaVersion: 1,
  lastPlayedDate: null,
  lastResult: null,
  stats: { currentStreak: 0, maxStreak: 0, lastWinDate: null },
};

export function load(storage: Storage): PersistedShape {
  const raw = storage.getItem(KEY);
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.schemaVersion !== 1) return EMPTY;
    return parsed as PersistedShape;
  } catch {
    return EMPTY;
  }
}

export function save(storage: Storage, data: PersistedShape): void {
  storage.setItem(KEY, JSON.stringify(data));
}
