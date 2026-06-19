import { FormEvent, useState } from "react";
import { Era } from "../game/types";
import { eraRange } from "../game/eras";
import styles from "./GuessInput.module.css";

export function GuessInput({
  era,
  currentYear,
  disabled,
  onSubmit,
}: {
  era: Era;
  currentYear: number;
  disabled: boolean;
  onSubmit: (year: number) => void;
}) {
  const [value, setValue] = useState("");
  const { from, to } = eraRange(era, currentYear);
  const min = from;
  const max = to - 1;

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
        <button className={styles.btn} type="submit" disabled={disabled}>Guess</button>
      </div>
      <div className={styles.hint}>Enter a year between {min} and {max}</div>
    </form>
  );
}
