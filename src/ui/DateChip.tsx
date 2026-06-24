import { Locale } from "../i18n/types";
import styles from "./DateChip.module.css";

const INTL_LOCALE: Record<Locale, string> = {
  es: "es-AR",
  en: "en-US",
};

function formatDayMonth(todayIso: string, locale: Locale): string {
  const [y, m, d] = todayIso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

export function DateChip({ todayIso, locale }: { todayIso: string; locale: Locale }) {
  return <span className={styles.chip}>📅 {formatDayMonth(todayIso, locale)}</span>;
}
