import { Era } from "../../src/i18n/types";
import { LOCALES } from "../../src/i18n/types";
import { eraRange } from "../../src/game/eras";
import { currentYearArt } from "../../src/game/today";

void LOCALES; // imported so consumers can also pull it via the same module if desired

const ID_RE = /^[a-z0-9-]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateId(id: string, existingIds: string[]): string | null {
  if (!id) return "id is required";
  if (!ID_RE.test(id)) return "id must be kebab-case (lowercase letters, digits, hyphens)";
  if (existingIds.includes(id)) return `id "${id}" is already in use`;
  return null;
}

export function validateYearInEra(year: number, era: Era): string | null {
  if (!Number.isInteger(year)) return "year must be an integer";
  const { from, to } = eraRange(era, currentYearArt());
  if (year < from || year >= to) {
    return `year ${year} is not in era ${era} [${from}, ${to})`;
  }
  return null;
}

export function validateAnswerRange(from: number, to: number, era: Era): string | null {
  if (!Number.isInteger(from) || !Number.isInteger(to)) return "from and to must be integers";
  if (from > to) return "from must be ≤ to";
  const fromMsg = validateYearInEra(from, era);
  if (fromMsg) return fromMsg;
  const toMsg = validateYearInEra(to, era);
  if (toMsg) return toMsg;
  return null;
}

export function validateNonEmpty(value: string, fieldName: string): string | null {
  if (!value || !value.trim()) return `${fieldName} must not be empty`;
  return null;
}

export function validateDate(date: string, existingDates: string[]): string | null {
  if (!DATE_RE.test(date)) return "date format must be YYYY-MM-DD";
  const [y, m, d] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  if (
    parsed.getUTCFullYear() !== y ||
    parsed.getUTCMonth() !== m - 1 ||
    parsed.getUTCDate() !== d
  ) {
    return `invalid calendar date: ${date}`;
  }
  if (existingDates.includes(date)) return `date ${date} is already scheduled`;
  return null;
}
