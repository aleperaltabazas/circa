import { GameState } from "../game/types";
import { Hints } from "./Hints";
import { GuessTiles } from "./GuessTiles";
import { ColorLegend } from "./ColorLegend";
import { EraPill } from "./EraPill";
import { GuessInput } from "./GuessInput";
import styles from "./Board.module.css";

export function Board({
  state,
  puzzleNumber,
  todayLabel,
  currentYear,
  onGuess,
}: {
  state: GameState;
  puzzleNumber: number;
  todayLabel: string;
  currentYear: number;
  onGuess: (year: number) => void;
}) {
  return (
    <div className={styles.frame}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Circa</div>
          <div className={styles.meta}>Puzzle #{puzzleNumber} — {todayLabel}</div>
        </div>
        <EraPill era={state.puzzle.era} />
      </div>
      <Hints hints={state.puzzle.hints} revealed={state.hintsRevealed} />
      <GuessTiles guesses={state.guesses} />
      <ColorLegend />
      <GuessInput
        era={state.puzzle.era}
        currentYear={currentYear}
        disabled={state.outcome !== "playing"}
        onSubmit={onGuess}
      />
    </div>
  );
}
