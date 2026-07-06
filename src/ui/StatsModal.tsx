import { useEffect } from "react";
import confetti from "canvas-confetti";
import { GameState, Puzzle, Stats } from "../game/types";
import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import { answerRange, distanceToRange } from "../game/scoring";
import { isPointAnswer } from "../game/types";
import { ShareButton } from "./ShareButton";
import { Markdown } from "./Markdown";
import { formatAnswer } from "./answer";
import styles from "./StatsModal.module.css";

export function StatsModal({
  stats,
  gameState,
  puzzle,
  puzzleNumber,
  currentYear,
  url,
  locale,
  onClose,
}: {
  stats: Stats;
  gameState: GameState;
  puzzle: Puzzle;
  puzzleNumber: number;
  currentYear: number;
  url: string;
  locale: Locale;
  onClose: () => void;
}) {
  const s = STRINGS[locale];

  const won = gameState.outcome === "won";
  const headline = won ? s.outcomeWinHeadline : s.outcomeLossHeadline;
  const sub = won
    ? s.outcomeWinSub(gameState.guesses.length)
    : s.outcomeLossSub(formatAnswer(gameState.puzzle.answer));
  const lastGuess = gameState.guesses.at(-1);
  const answer = gameState.puzzle.answer;
  const range = answerRange(answer, gameState.puzzle.era, currentYear);
  const offBy = lastGuess
    ? won
      ? isPointAnswer(answer) && lastGuess.year !== answer.year
        ? Math.abs(lastGuess.year - answer.year)
        : null
      : distanceToRange(lastGuess.year, range)
    : null;

  useEffect(() => {
    if (won) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.3 } });
    }
  }, [won]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{s.appTitle} #{puzzleNumber}</h2>
        <p className={styles.outcomeHeadline}>{headline}</p>
        <p className={styles.outcomeSub}>{sub}</p>
        {offBy !== null && offBy > 0 && (
          <p className={styles.offBy}>{won ? s.outcomeWinOffBy(offBy) : s.outcomeLossOffBy(offBy)}</p>
        )}
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
        <p className={styles.description}><Markdown>{puzzle.description[locale]}</Markdown></p>
        <div className={styles.actions}>
          <button className={styles.close} type="button" onClick={onClose}>{s.close}</button>
          <ShareButton state={gameState} puzzleNumber={puzzleNumber} url={url} locale={locale} />
        </div>
      </div>
    </div>
  );
}
