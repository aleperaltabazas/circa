import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import styles from "./ColorLegend.module.css";

const SWATCHES = [
  { color: "#ef4444" }, // far
  { color: "#eab308" }, // mid
  { color: "#22c55e" }, // close
  { color: "#15803d" }, // perfect
];

export function ColorLegend({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  return (
    <div>
      <div className={styles.bar}>
        {SWATCHES.map((sw, i) => (
          <div key={i} className={styles.swatch} style={{ background: sw.color }} />
        ))}
      </div>
      <div className={styles.labels}>
        <span>{s.legendFar}</span>
        <span>{s.legendCloser}</span>
        <span>{s.legendExact}</span>
      </div>
    </div>
  );
}
