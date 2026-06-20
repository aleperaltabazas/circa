import { FormEvent, useState } from "react";
import { Era } from "../game/types";
import { eraRange } from "../game/eras";
import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import styles from "./GuessInput.module.css";

export function GuessInput({
  era,
  currentYear,
  disabled,
  locale,
  onSubmit,
}: {
  era: Era;
  currentYear: number;
  disabled: boolean;
  locale: Locale;
  onSubmit: (year: number) => void;
}) {
  const [value, setValue] = useState("");
  const { from, to } = eraRange(era, currentYear);
  const min = from;
  const max = to - 1;
  const s = STRINGS[locale];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) return;
    onSubmit(parsed);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.row}>
        <input
          className={styles.input}
          type="number"
          min={min}
          max={max}
          step={1}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`${min}–${max}`}
        />
        <button className={styles.btn} type="submit" disabled={disabled}>{s.guess}</button>
      </div>
      <div className={styles.hint}>{s.rangeHint(min, max)}</div>
    </form>
  );
}
