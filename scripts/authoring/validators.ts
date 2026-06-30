import { Era } from "../../src/i18n/types";
import { eraRange } from "../../src/game/eras";
import { currentYearArt } from "../../src/game/today";

const ID_RE = /^[a-z0-9-]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const ERAS: Era[] = ["prehistory", "ancient", "medieval", "modern", "recent"];

export function eraOf(year: number): Era | null {
  if (!Number.isInteger(year)) return null;
  const cy = currentYearArt();
  for (const era of ERAS) {
    const { from, to } = eraRange(era, cy);
    if (year >= from && year < to) return era;
  }
  return null;
}

export function validateYearHasEra(year: number): string | null {
  if (!Number.isInteger(year)) return "year must be an integer";
  if (eraOf(year) === null) return `year ${year} is outside any known era`;
  return null;
}

export function validateSameEraRange(from: number, to: number): string | null {
  if (!Number.isInteger(from) || !Number.isInteger(to)) return "from and to must be integers";
  if (from > to) return "from must be ≤ to";
  const eraFrom = eraOf(from);
  if (eraFrom === null) return `year ${from} is outside any known era`;
  const eraTo = eraOf(to);
  if (eraTo === null) return `year ${to} is outside any known era`;
  if (eraFrom !== eraTo) {
    return `range spans two eras: ${from} is in ${eraFrom} but ${to} is in ${eraTo} — a puzzle must lie in a single era`;
  }
  return null;
}

export function validateMargin(margin: number | undefined): string | null {
  if (margin === undefined) return null;
  if (!Number.isInteger(margin) || margin < 0 || margin > 20) return "margin must be an integer between 0 and 20";
  return null;
}

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
