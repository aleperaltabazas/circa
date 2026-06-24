import { Era } from "../game/types";
import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import styles from "./EraPill.module.css";

export function EraPill({ era, locale }: { era: Era; locale: Locale }) {
  const s = STRINGS[locale];
  return (
    <span className={styles.pill} title={s.eraTooltip}>
      {s.eraLabel[era]}
    </span>
  );
}
