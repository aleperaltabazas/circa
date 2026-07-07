import { GameState } from "../game/types";
import { statusFor } from "../game/previousPuzzles";
import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import { formatDayMonthNumeric } from "./dateFormat";
import { formatAnswer } from "./answer";
import styles from "./PreviousPuzzlesModal.module.css";

const STATUS_ICON = { won: "✅", lost: "❌", inProgress: "🕓", notStarted: "➖" } as const;

export function PreviousPuzzlesModal({
  dates,
  history,
  locale,
  onSelect,
  onClose,
}: {
  dates: string[];
  history: Record<string, GameState>;
  locale: Locale;
  onSelect: (date: string) => void;
  onClose: () => void;
}) {
  const s = STRINGS[locale];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{s.previousPuzzles.title}</h2>
        <div className={styles.cardRow}>
          {dates.map((date) => {
            const status = statusFor(date, history);
            const finished = status === "won" || status === "lost";
            return (
              <button
                key={date}
                type="button"
                className={styles.card}
                onClick={() => onSelect(date)}
                aria-label={`${formatDayMonthNumeric(date)} — ${s.previousPuzzles[status]}`}
              >
                <span className={styles.date}>{formatDayMonthNumeric(date)}</span>
                <span className={styles.icon}>{STATUS_ICON[status]}</span>
                {finished && (
                  <span className={styles.year}>{formatAnswer(history[date].puzzle.answer)}</span>
                )}
              </button>
            );
          })}
        </div>
        <div className={styles.actions}>
          <button className={styles.close} type="button" onClick={onClose}>
            {s.close}
          </button>
        </div>
      </div>
    </div>
  );
}
