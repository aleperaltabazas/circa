import { GameState, Stats } from "../game/types";
import { ShareButton } from "./ShareButton";
import styles from "./StatsModal.module.css";

export function StatsModal({
  stats,
  gameState,
  puzzleNumber,
  url,
  onClose,
}: {
  stats: Stats;
  gameState: GameState;
  puzzleNumber: number;
  url: string;
  onClose: () => void;
}) {
  const outcomeMsg =
    gameState.outcome === "won"
      ? `You won in ${gameState.guesses.length}/5`
      : `Game over — the answer was ${gameState.puzzle.answer}`;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Daily Year #{puzzleNumber}</h2>
        <p className={styles.outcome}>{outcomeMsg}</p>
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{stats.currentStreak}</div>
            <div className={styles.statLabel}>Current</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{stats.maxStreak}</div>
            <div className={styles.statLabel}>Max</div>
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.close} type="button" onClick={onClose}>Close</button>
          <ShareButton state={gameState} puzzleNumber={puzzleNumber} url={url} />
        </div>
      </div>
    </div>
  );
}
