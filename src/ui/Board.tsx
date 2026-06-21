import { GameState } from "../game/types";
import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import { Hints } from "./Hints";
import { GuessTiles } from "./GuessTiles";
import { ColorLegend } from "./ColorLegend";
import { EraPill } from "./EraPill";
import { GuessInput } from "./GuessInput";
import { LocaleToggle } from "./LocaleToggle";
import styles from "./Board.module.css";

export function Board({
  state,
  puzzleNumber,
  todayLabel,
  currentYear,
  locale,
  onLocaleChange,
  onGuess,
}: {
  state: GameState;
  puzzleNumber: number;
  todayLabel: string;
  currentYear: number;
  locale: Locale;
  onLocaleChange: (loc: Locale) => void;
  onGuess: (year: number) => void;
}) {
  const s = STRINGS[locale];
  return (
    <div className={styles.frame}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>{s.appTitle}</div>
          <div className={styles.meta}>{s.puzzleMeta(puzzleNumber, todayLabel)}</div>
        </div>
        <div className={styles.headerRight}>
          <EraPill era={state.puzzle.era} locale={locale} />
          <LocaleToggle locale={locale} onChange={onLocaleChange} />
        </div>
      </div>
      <Hints
        hints={state.puzzle.hints[locale]}
        revealed={state.hintsRevealed}
        lockedLabel={s.locked}
      />
      <GuessTiles guesses={state.guesses} locale={locale} />
      <ColorLegend locale={locale} />
      <GuessInput
        era={state.puzzle.era}
        currentYear={currentYear}
        disabled={state.outcome !== "playing"}
        locale={locale}
        onSubmit={onGuess}
      />
    </div>
  );
}
