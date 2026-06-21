import { GameState, Stats } from "../game/types";
import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import { ShareButton } from "./ShareButton";
import { formatAnswer } from "./answer";
import styles from "./StatsModal.module.css";

export function StatsModal({
  stats,
  gameState,
  puzzleNumber,
  url,
  locale,
  onClose,
}: {
  stats: Stats;
  gameState: GameState;
  puzzleNumber: number;
  url: string;
  locale: Locale;
  onClose: () => void;
}) {
  const s = STRINGS[locale];
  const outcomeMsg =
    gameState.outcome === "won"
      ? s.outcomeWin(gameState.guesses.length)
      : s.outcomeLoss(formatAnswer(gameState.puzzle.answer));
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{s.appTitle} #{puzzleNumber}</h2>
        <p className={styles.outcome}>{outcomeMsg}</p>
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{stats.currentStreak}</div>
            <div className={styles.statLabel}>{s.currentStreak}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{stats.maxStreak}</div>
            <div className={styles.statLabel}>{s.maxStreak}</div>
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.close} type="button" onClick={onClose}>{s.close}</button>
          <ShareButton state={gameState} puzzleNumber={puzzleNumber} url={url} locale={locale} />
        </div>
      </div>
    </div>
  );
}
