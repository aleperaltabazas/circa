import { useEffect, useMemo, useReducer, useState } from "react";
import puzzlesData from "./content/puzzles.json";
import scheduleData from "./content/schedule.json";
import { Puzzle, Schedule } from "./game/types";
import { selectPuzzle } from "./game/selectPuzzle";
import { puzzleNumberFor } from "./game/puzzleNumber";
import { initialState, reducer } from "./game/reducer";
import { today, currentYearArt } from "./game/today";
import { applyResult } from "./game/streak";
import { load, save, PersistedShape } from "./storage/localStorage";
import { Board } from "./ui/Board";
import { StatsModal } from "./ui/StatsModal";
import styles from "./App.module.css";

const puzzles = puzzlesData as Puzzle[];
const schedule = scheduleData as Schedule;

export function App() {
  const todayIso = today();
  const currentYear = currentYearArt();
  const puzzle = useMemo(() => selectPuzzle(todayIso, schedule, puzzles), [todayIso]);
  const puzzleNumber = useMemo(() => puzzleNumberFor(todayIso, schedule), [todayIso]);

  if (!puzzle || puzzleNumber === null) {
    return <div className={styles.empty}>No puzzle today, check back tomorrow.</div>;
  }

  return <Game puzzle={puzzle} puzzleNumber={puzzleNumber} todayIso={todayIso} currentYear={currentYear} />;
}

function Game({
  puzzle,
  puzzleNumber,
  todayIso,
  currentYear,
}: {
  puzzle: Puzzle;
  puzzleNumber: number;
  todayIso: string;
  currentYear: number;
}) {
  const [persisted, setPersisted] = useState<PersistedShape>(() => load(window.localStorage));
  const [state, dispatch] = useReducer(
    reducer,
    null,
    () =>
      persisted.lastPlayedDate === todayIso && persisted.lastResult?.puzzle.id === puzzle.id
        ? persisted.lastResult
        : initialState(puzzle),
  );
  const [modalOpen, setModalOpen] = useState(state.outcome !== "playing");

  useEffect(() => {
    const finishedNow = state.outcome !== "playing";
    let nextStats = persisted.stats;
    const previouslyFinished =
      persisted.lastPlayedDate === todayIso && persisted.lastResult?.outcome !== "playing";
    if (finishedNow && !previouslyFinished) {
      nextStats = applyResult(persisted.stats, state.outcome === "won" ? "won" : "lost", todayIso);
      setModalOpen(true);
    }
    const next: PersistedShape = {
      schemaVersion: 1,
      lastPlayedDate: todayIso,
      lastResult: state,
      stats: nextStats,
    };
    save(window.localStorage, next);
    setPersisted(next);
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
        onGuess={(year) => dispatch({ type: "submitGuess", year, currentYear })}
      />
      {modalOpen && (
        <StatsModal
          stats={persisted.stats}
          gameState={state}
          puzzleNumber={puzzleNumber}
          url={url}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
