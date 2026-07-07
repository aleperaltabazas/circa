import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import { formatDayMonth } from "./dateFormat";
import styles from "./DateChip.module.css";
import tooltip from "./Tooltip.module.css";

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
