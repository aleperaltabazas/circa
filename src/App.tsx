import { useEffect, useMemo, useReducer, useState } from "react";
import puzzlesData from "./content/puzzles.json5";
import scheduleData from "./content/schedule.json5";
import { Puzzle, Schedule } from "./game/types";
import { selectPuzzle } from "./game/selectPuzzle";
import { puzzleNumberFor } from "./game/puzzleNumber";
import { initialState, reducer } from "./game/reducer";
import { today, currentYearArt } from "./game/today";
import { applyResult } from "./game/streak";
import { load, save, PersistedShape } from "./storage/localStorage";
import { Locale } from "./i18n/types";
import { STRINGS } from "./i18n/strings";
import { Board } from "./ui/Board";
import { StatsModal } from "./ui/StatsModal";
import { TriviaBox } from "./ui/TriviaBox";
import styles from "./App.module.css";

const puzzles = puzzlesData as Puzzle[];
const schedule = scheduleData as Schedule;

function isPreviouslyFinished(
  persisted: PersistedShape,
  todayIso: string,
  puzzle: Puzzle,
): boolean {
  return (
    persisted.lastPlayedDate === todayIso &&
    persisted.lastResult?.puzzle.id === puzzle.id &&
    persisted.lastResult?.outcome !== "playing"
  );
}

export function App() {
  const todayIso = today();
  const currentYear = currentYearArt();
  const puzzle = useMemo(() => selectPuzzle(todayIso, schedule, puzzles), [todayIso]);
  const puzzleNumber = useMemo(() => puzzleNumberFor(todayIso, schedule), [todayIso]);
  const [persisted, setPersisted] = useState<PersistedShape>(() => load(window.localStorage));
  const locale = persisted.locale;

  function handleLocaleChange(next: Locale) {
    const updated = { ...persisted, locale: next };
    save(window.localStorage, updated);
    setPersisted(updated);
  }

  if (!puzzle || puzzleNumber === null) {
    return <div className={styles.empty}>{STRINGS[locale].noPuzzle}</div>;
  }

  return (
    <Game
      puzzle={puzzle}
      puzzleNumber={puzzleNumber}
      todayIso={todayIso}
      currentYear={currentYear}
      persisted={persisted}
      setPersisted={setPersisted}
      onLocaleChange={handleLocaleChange}
    />
  );
}

function Game({
  puzzle,
  puzzleNumber,
  todayIso,
  currentYear,
  persisted,
  setPersisted,
  onLocaleChange,
}: {
  puzzle: Puzzle;
  puzzleNumber: number;
  todayIso: string;
  currentYear: number;
  persisted: PersistedShape;
  setPersisted: (p: PersistedShape) => void;
  onLocaleChange: (loc: Locale) => void;
}) {
  const [state, dispatch] = useReducer(
    reducer,
    null,
    () =>
      persisted.lastPlayedDate === todayIso && persisted.lastResult?.puzzle.id === puzzle.id
        ? persisted.lastResult
        : initialState(puzzle),
  );
  const wasPreviouslyFinished = isPreviouslyFinished(persisted, todayIso, puzzle);
  const [modalOpen, setModalOpen] = useState(
    state.outcome !== "playing" && !wasPreviouslyFinished,
  );

  useEffect(() => {
    const finishedNow = state.outcome !== "playing";
    let nextStats = persisted.stats;
    const previouslyFinished = isPreviouslyFinished(persisted, todayIso, puzzle);
    if (finishedNow && !previouslyFinished) {
      nextStats = applyResult(persisted.stats, state.outcome === "won" ? "won" : "lost", todayIso);
      setModalOpen(true);
    }
    const next: PersistedShape = {
      ...persisted,
      schemaVersion: 3,
      lastPlayedDate: todayIso,
      lastResult: state,
      stats: nextStats,
    };
    save(window.localStorage, next);
    setPersisted(next);
    // persisted is intentionally excluded — previouslyFinished guard makes
    // stale-closure reads idempotent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const url = window.location.origin + window.location.pathname;

  return (
    <>
      <Board
        state={state}
        puzzleNumber={puzzleNumber}
        todayLabel={todayIso}
        currentYear={currentYear}
        locale={persisted.locale}
        onLocaleChange={onLocaleChange}
        onGuess={(year) => dispatch({ type: "submitGuess", year, currentYear })}
      />
      {state.outcome !== "playing" && !modalOpen && (
        <TriviaBox
          puzzle={puzzle}
          gameState={state}
          puzzleNumber={puzzleNumber}
          url={url}
          locale={persisted.locale}
        />
      )}
      {modalOpen && (
        <StatsModal
          stats={persisted.stats}
          gameState={state}
          puzzle={puzzle}
          puzzleNumber={puzzleNumber}
          url={url}
          locale={persisted.locale}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
