import { Locale } from "../i18n/types";

const INTL_LOCALE: Record<Locale, string> = {
  es: "es-AR",
};

export function formatDayMonth(iso: string, locale: Locale): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

export function formatDayMonthNumeric(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}
