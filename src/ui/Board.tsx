import { GameState } from "../game/types";
import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import { Hints } from "./Hints";
import { GuessTiles } from "./GuessTiles";
import { ColorLegend } from "./ColorLegend";
import { DateChip } from "./DateChip";
import { EraPill } from "./EraPill";
import { GuessInput } from "./GuessInput";
import { LocaleToggle } from "./LocaleToggle";
import { ParBadge } from "./ParBadge";
import { MarginBadge } from "./MarginBadge";
import { HistoryIcon } from "./icons/HistoryIcon";
import styles from "./Board.module.css";

export function Board({
  state,
  puzzleNumber,
  todayLabel,
  currentYear,
  locale,
  onLocaleChange,
  onHelpClick,
  onOpenPrevious,
  onGuess,
}: {
  state: GameState;
  puzzleNumber: number;
  todayLabel: string;
  currentYear: number;
  locale: Locale;
  onLocaleChange: (loc: Locale) => void;
  onHelpClick: () => void;
  onOpenPrevious: () => void;
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
          <button className={styles.helpBtn} onClick={onHelpClick} aria-label="Cómo se juega">
            ?
          </button>
          <LocaleToggle locale={locale} onChange={onLocaleChange} />
        </div>
      </div>
      <div className={styles.previousRow}>
        <button className={styles.previousBtn} type="button" onClick={onOpenPrevious}>
          <HistoryIcon /> {s.previousPuzzles.buttonLabel}
        </button>
      </div>
      <div className={styles.contextRow}>
        <EraPill era={state.puzzle.era} locale={locale} />
        {state.puzzle.dateAnchored && <DateChip todayIso={todayLabel} locale={locale} />}
        <MarginBadge answer={state.puzzle.answer} locale={locale} era={state.puzzle.era} currentYear={currentYear} />
        <ParBadge par={state.puzzle.par} />
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
        guessedYears={state.guesses.map((g) => g.year)}
        locale={locale}
        onSubmit={onGuess}
      />
    </div>
  );
}
