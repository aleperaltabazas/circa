import { Guess } from "../game/types";
import { colorFor } from "./color";
import styles from "./GuessTiles.module.css";

export function GuessTiles({ guesses }: { guesses: Guess[] }) {
  const tiles = [0, 1, 2, 3, 4].map((i) => guesses[i] ?? null);
  return (
    <div className={styles.row}>
      {tiles.map((g, i) =>
        g ? (
          <div
            key={i}
            data-filled="true"
            className={styles.tile}
            style={{ background: colorFor(g) }}
          >
            {g.year}
          </div>
        ) : (
          <div key={i} className={`${styles.tile} ${styles.empty}`}>—</div>
        ),
      )}
    </div>
  );
}
