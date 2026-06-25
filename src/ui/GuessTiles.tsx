import { Direction, Guess } from "../game/types";
import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import { closenessHintKey } from "../game/closenessHint";
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
    <div className={styles.wrap}>
      <div className={styles.row}>
        {tiles.map((g, i) =>
          g ? (
            <div
              key={i}
              data-filled="true"
              data-bucket={g.bucket}
              className={`${styles.tile} ${g.bucket === "perfect" ? styles.perfect : ""}`}
              style={{ background: colorFor(g) }}
              aria-label={s.guessAria(g.year, s.directionLabel[g.direction])}
            >
              <span className={styles.year}>{g.year}</span>
              {ARROW[g.direction] && (
                <span className={styles.arrow} aria-hidden="true">{ARROW[g.direction]}</span>
              )}
              {g.bucket === "perfect" && (
                <>
                  <span className={`${styles.sparkle} ${styles.sparkleTl}`} aria-hidden="true">✨</span>
                  <span className={`${styles.sparkle} ${styles.sparkleBr}`} aria-hidden="true">✨</span>
                </>
              )}
            </div>
          ) : (
            <div key={i} className={`${styles.tile} ${styles.empty}`}>—</div>
          ),
        )}
      </div>
      <div className={styles.row}>
        {tiles.map((g, i) => {
          if (!g || g.bucket === "perfect") {
            return <div key={i} className={styles.pillSlot} />;
          }
          const prev = i > 0 ? guesses[i - 1] : null;
          const prevRatio = prev ? prev.distanceRatio : null;
          const hintKey = closenessHintKey(g.distanceRatio, prevRatio, 1);
          return (
            <div key={i} className={styles.pillSlot}>
              <span className={styles.hintPill}>{s.closenessHints[hintKey]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
