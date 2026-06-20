import { Era } from "../game/types";
import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import styles from "./EraPill.module.css";

export function EraPill({ era, locale }: { era: Era; locale: Locale }) {
  return <span className={styles.pill}>{STRINGS[locale].eraLabel[era]}</span>;
}
