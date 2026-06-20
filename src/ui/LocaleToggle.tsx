import { Locale, LOCALES } from "../i18n/types";
import styles from "./LocaleToggle.module.css";

export function LocaleToggle({
  locale,
  onChange,
}: {
  locale: Locale;
  onChange: (loc: Locale) => void;
}) {
  return (
    <select
      className={styles.select}
      value={locale}
      onChange={(e) => onChange(e.target.value as Locale)}
      aria-label="Language"
    >
      {LOCALES.map((loc) => (
        <option key={loc} value={loc}>
          {loc.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
