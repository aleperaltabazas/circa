import { Direction, Guess } from "../game/types";
import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import { colorFor } from "./color";
import styles from "./GuessTiles.module.css";

const ARROW: Record<Direction, string | null> = {
  later: "▲",
  earlier: "▼",
  match: null,
};

export function GuessTiles({ guesses, locale }: { guesses: Guess[]; locale: Locale }) {
  const s = STRINGS[locale];
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
            aria-label={s.guessAria(g.year, s.directionLabel[g.direction])}
          >
            <span className={styles.year}>{g.year}</span>
            {ARROW[g.direction] && (
              <span className={styles.arrow} aria-hidden="true">{ARROW[g.direction]}</span>
            )}
          </div>
        ) : (
          <div key={i} className={`${styles.tile} ${styles.empty}`}>—</div>
        ),
      )}
    </div>
  );
}
