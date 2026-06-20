import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import styles from "./ColorLegend.module.css";

export function ColorLegend({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  return (
    <div>
      <div className={styles.bar} />
      <div className={styles.labels}>
        <span>{s.legendFar}</span>
        <span>{s.legendCloser}</span>
        <span>{s.legendExact}</span>
      </div>
    </div>
  );
}
