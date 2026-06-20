import styles from "./Hints.module.css";

export function Hints({
  hints,
  revealed,
  lockedLabel,
}: {
  hints: string[];
  revealed: number;
  lockedLabel: string;
}) {
  return (
    <div className={styles.list}>
      {hints.map((text, i) => {
        const locked = i >= revealed;
        return (
          <div key={i} className={`${styles.hint} ${locked ? styles.locked : ""}`}>
            <span className={`${styles.num} ${locked ? styles.numLocked : ""}`}>{i + 1}</span>
            {locked ? lockedLabel : text}
          </div>
        );
      })}
    </div>
  );
}
