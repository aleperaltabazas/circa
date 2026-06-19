import styles from "./Hints.module.css";

export function Hints({ hints, revealed }: { hints: string[]; revealed: number }) {
  return (
    <div className={styles.list}>
      {hints.map((text, i) => {
        const locked = i >= revealed;
        return (
          <div key={i} className={`${styles.hint} ${locked ? styles.locked : ""}`}>
            <span className={`${styles.num} ${locked ? styles.numLocked : ""}`}>{i + 1}</span>
            {locked ? "Locked — guess to reveal" : text}
          </div>
        );
      })}
    </div>
  );
}
