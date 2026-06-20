import { GameState, Stats } from "../game/types";
import { Locale, DEFAULT_LOCALE } from "../i18n/types";

const KEY = "circa";

export type PersistedShape = {
  schemaVersion: 2;
  lastPlayedDate: string | null;
  lastResult: GameState | null;
  stats: Stats;
  locale: Locale;
};

export const EMPTY: PersistedShape = {
  schemaVersion: 2,
  lastPlayedDate: null,
  lastResult: null,
  stats: { currentStreak: 0, maxStreak: 0, lastWinDate: null },
  locale: DEFAULT_LOCALE,
};

export function load(storage: Storage): PersistedShape {
  const raw = storage.getItem(KEY);
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.schemaVersion === 1) {
      return { ...parsed, schemaVersion: 2, locale: DEFAULT_LOCALE } as PersistedShape;
    }
    if (parsed?.schemaVersion !== 2) return EMPTY;
    return parsed as PersistedShape;
  } catch {
    return EMPTY;
  }
}

export function save(storage: Storage, data: PersistedShape): void {
  storage.setItem(KEY, JSON.stringify(data));
}
