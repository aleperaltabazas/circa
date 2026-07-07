import { useEffect, useMemo, useReducer, useState } from "react";
import puzzlesData from "./content/puzzles.json5";
import scheduleData from "./content/schedule.json5";
import { Puzzle, Schedule } from "./game/types";
import { selectPuzzle } from "./game/selectPuzzle";
import { puzzleNumberFor } from "./game/puzzleNumber";
import { initialState, reducer } from "./game/reducer";
import { today, currentYearArt } from "./game/today";
import { applyResult } from "./game/streak";
import { previousPuzzleDates } from "./game/previousPuzzles";
import { load, save, PersistedShape } from "./storage/localStorage";
import { Locale } from "./i18n/types";
import { STRINGS } from "./i18n/strings";
import { Board } from "./ui/Board";
import { StatsModal } from "./ui/StatsModal";
import { WelcomeModal } from "./ui/WelcomeModal";
import { PreviousPuzzlesModal } from "./ui/PreviousPuzzlesModal";
import { TriviaBox } from "./ui/TriviaBox";
import { getCookie, setCookie } from "./storage/cookies";
import styles from "./App.module.css";

const CHANGELOG_VERSION = "1";

const puzzles = puzzlesData as Puzzle[];
const schedule = scheduleData as Schedule;

function isPreviouslyFinished(
  persisted: PersistedShape,
  activeDate: string,
  puzzle: Puzzle,
): boolean {
  const entry = persisted.history[activeDate];
  return entry?.puzzle.id === puzzle.id && entry?.outcome !== "playing";
}

export function App() {
  const todayIso = today();
  const currentYear = currentYearArt();
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const puzzle = useMemo(() => selectPuzzle(selectedDate, schedule, puzzles), [selectedDate]);
  const puzzleNumber = useMemo(() => puzzleNumberFor(selectedDate, schedule), [selectedDate]);
  const [persisted, setPersisted] = useState<PersistedShape>(() => load(window.localStorage));
  const locale = persisted.locale;
  const isNewPlayer = persisted.lastPlayedDate === null;
  const [welcomeOpen, setWelcomeOpen] = useState(
    () => getCookie("circa_changelog") !== CHANGELOG_VERSION,
  );
  const [helpOpen, setHelpOpen] = useState(false);
  const [previousOpen, setPreviousOpen] = useState(false);

  function handleWelcomeClose() {
    setCookie("circa_changelog", CHANGELOG_VERSION, 365);
    setWelcomeOpen(false);
    setHelpOpen(false);
  }

  function handleLocaleChange(next: Locale) {
    const updated = { ...persisted, locale: next };
    save(window.localStorage, updated);
    setPersisted(updated);
  }

  if (!puzzle || puzzleNumber === null) {
    return <div className={styles.empty}>{STRINGS[locale].noPuzzle}</div>;
  }

  return (
    <>
      {(welcomeOpen || helpOpen) && (
        <WelcomeModal
          isNewPlayer={isNewPlayer || helpOpen}
          locale={locale}
          onClose={handleWelcomeClose}
        />
      )}
      {previousOpen && (
        <PreviousPuzzlesModal
          dates={[...previousPuzzleDates(todayIso, schedule, 6)].reverse().concat(todayIso)}
          history={persisted.history}
          locale={locale}
          onSelect={(date) => {
            setSelectedDate(date);
            setPreviousOpen(false);
          }}
          onClose={() => setPreviousOpen(false)}
        />
      )}
      <Game
        key={selectedDate}
        puzzle={puzzle}
        puzzleNumber={puzzleNumber}
        activeDate={selectedDate}
        todayIso={todayIso}
        currentYear={currentYear}
        persisted={persisted}
        setPersisted={setPersisted}
        onLocaleChange={handleLocaleChange}
        onHelpClick={() => setHelpOpen(true)}
        onOpenPrevious={() => setPreviousOpen(true)}
      />
    </>
  );
}

function Game({
  puzzle,
  puzzleNumber,
  activeDate,
  todayIso,
  currentYear,
  persisted,
  setPersisted,
  onLocaleChange,
  onHelpClick,
  onOpenPrevious,
}: {
  puzzle: Puzzle;
  puzzleNumber: number;
  activeDate: string;
  todayIso: string;
  currentYear: number;
  persisted: PersistedShape;
  setPersisted: (p: PersistedShape) => void;
  onLocaleChange: (loc: Locale) => void;
  onHelpClick: () => void;
  onOpenPrevious: () => void;
}) {
  const [state, dispatch] = useReducer(
    reducer,
    null,
    () =>
      persisted.history[activeDate]?.puzzle.id === puzzle.id
        ? persisted.history[activeDate]
        : initialState(puzzle),
  );
  const wasPreviouslyFinished = isPreviouslyFinished(persisted, activeDate, puzzle);
  const [modalOpen, setModalOpen] = useState(
    state.outcome !== "playing" && !wasPreviouslyFinished,
  );

  useEffect(() => {
    const isToday = activeDate === todayIso;
    const finishedNow = state.outcome !== "playing";
    let nextStats = persisted.stats;
    const previouslyFinished = isPreviouslyFinished(persisted, activeDate, puzzle);
    if (finishedNow && !previouslyFinished) {
      if (isToday) {
        nextStats = applyResult(persisted.stats, state.outcome === "won" ? "won" : "lost", todayIso);
      }
      setModalOpen(true);
    }
    const next: PersistedShape = {
      ...persisted,
      schemaVersion: 5,
      lastPlayedDate:
        isToday && state.guesses.length > 0 ? todayIso : persisted.lastPlayedDate,
      history: { ...persisted.history, [activeDate]: state },
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
        todayLabel={activeDate}
        currentYear={currentYear}
        locale={persisted.locale}
        onLocaleChange={onLocaleChange}
        onHelpClick={onHelpClick}
        onOpenPrevious={onOpenPrevious}
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
          currentYear={currentYear}
          url={url}
          locale={persisted.locale}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
