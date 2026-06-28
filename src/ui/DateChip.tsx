import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import styles from "./DateChip.module.css";
import tooltip from "./Tooltip.module.css";

const INTL_LOCALE: Record<Locale, string> = {
  es: "es-AR",
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

export function DateChip({
  todayIso,
  locale,
}: {
  todayIso: string;
  locale: Locale;
}) {
  const s = STRINGS[locale];
  return (
    <span
      className={`${styles.chip} ${tooltip.host}`}
      data-tooltip={s.dateTooltip}
      tabIndex={0}
      aria-label={s.dateTooltip}
    >
      📅 {formatDayMonth(todayIso, locale)}
    </span>
  );
}
