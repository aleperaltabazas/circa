import { GameState, Stats } from "../game/types";
import { Locale, DEFAULT_LOCALE } from "../i18n/types";

const KEY = "circa";

export type PersistedShape = {
  schemaVersion: 5;
  lastPlayedDate: string | null;
  history: Record<string, GameState>;
  stats: Stats;
  locale: Locale;
};

type PersistedShapeV4 = {
  schemaVersion: 4;
  lastPlayedDate: string | null;
  lastResult: GameState | null;
  stats: Stats;
  locale: Locale;
};

export const EMPTY: PersistedShape = {
  schemaVersion: 5,
  lastPlayedDate: null,
  history: {},
  stats: { currentStreak: 0, maxStreak: 0, lastWinDate: null },
  locale: DEFAULT_LOCALE,
};

function migrateV4(old: PersistedShapeV4): PersistedShape {
  return {
    schemaVersion: 5,
    lastPlayedDate: old.lastPlayedDate,
    history: old.lastPlayedDate && old.lastResult ? { [old.lastPlayedDate]: old.lastResult } : {},
    stats: old.stats,
    locale: old.locale,
  };
}

export function load(storage: Storage): PersistedShape {
  const raw = storage.getItem(KEY);
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.schemaVersion === 5) return parsed as PersistedShape;
    if (parsed?.schemaVersion === 4) return migrateV4(parsed as PersistedShapeV4);
    return EMPTY;
  } catch {
    return EMPTY;
  }
}

export function save(storage: Storage, data: PersistedShape): void {
  storage.setItem(KEY, JSON.stringify(data));
}
