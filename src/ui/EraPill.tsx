import { Era } from "../game/types";
import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import styles from "./EraPill.module.css";
import tooltip from "./Tooltip.module.css";

export function EraPill({ era, locale }: { era: Era; locale: Locale }) {
  const s = STRINGS[locale];
  return (
    <span
      className={`${styles.pill} ${styles[era]} ${tooltip.host}`}
      data-tooltip={s.eraTooltip}
      tabIndex={0}
      aria-label={s.eraTooltip}
    >
      {s.eraLabel[era]}
    </span>
  );
}
