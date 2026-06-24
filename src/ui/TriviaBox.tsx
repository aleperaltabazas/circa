import { GameState, Puzzle } from "../game/types";
import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import { formatAnswer } from "./answer";
import { Markdown } from "./Markdown";
import { ShareButton } from "./ShareButton";
import styles from "./TriviaBox.module.css";

export function TriviaBox({
  puzzle,
  gameState,
  puzzleNumber,
  url,
  locale,
}: {
  puzzle: Puzzle;
  gameState: GameState;
  puzzleNumber: number;
  url: string;
  locale: Locale;
}) {
  const s = STRINGS[locale];
  return (
    <div className={styles.frame}>
      <div className={styles.header}>
        <div className={styles.title}>{s.triviaTitle}</div>
        <div className={styles.answer}>{formatAnswer(puzzle.answer)}</div>
      </div>
      <p className={styles.body}><Markdown>{puzzle.description[locale]}</Markdown></p>
      <div className={styles.actions}>
        <ShareButton state={gameState} puzzleNumber={puzzleNumber} url={url} locale={locale} />
      </div>
    </div>
  );
}
