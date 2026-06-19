# Daily Year Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static-deployed daily browser game where the player guesses the year of a historic event from 5 progressively-revealed hints, with color-graded distance feedback and Wordle-style sharing.

**Architecture:** Single-page React app, all logic client-side. Pure game logic modules (`scoring`, `selectPuzzle`, `reducer`, `formatShare`) tested in isolation. Content (puzzles + schedule) lives in JSON files bundled at build time. State persists in localStorage. Deploys to GitHub Pages.

**Tech Stack:** React 18 + TypeScript, Vite, Vitest + @testing-library/react. No state library beyond `useReducer`. No component library — CSS modules + custom properties. Node 20+.

## Global Constraints

- Timezone for "today": `America/Argentina/Buenos_Aires`. Use `Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" })` to derive `YYYY-MM-DD`.
- Puzzle JSON shape: `{ id: string, era: "prehistory"|"ancient"|"medieval"|"modern"|"recent", answer: number, hints: string[] /* length 5 */ }`.
- Era ranges (inclusive `from`, exclusive `to`, except `recent.to` which is inclusive of current ART year): prehistory `[-3000, -753)`, ancient `[-753, 476)`, medieval `[476, 1453)`, modern `[1453, 1789)`, recent `[1789, currentYear]`.
- 5 hints per puzzle. 5 guesses per game. Win = exact year.
- Color buckets (first match wins) over `d = abs(guess - answer)` and `W = era width`: perfect `d==0`, green `d ≤ 0.01W`, lime `d ≤ 0.05W`, yellow `d ≤ 0.15W`, orange `d ≤ 0.40W`, red otherwise.
- Continuous color: `distanceRatio = min(d / W, 1)`, render as HSL hue `120 * (1 - ratio)` (green → red), `saturation 65%`, `lightness 50%`. A perfect guess renders as gold (`hsl(45, 90%, 55%)`).
- Share emoji mapping: perfect 🟡, green 🟢, lime 🟩, yellow 🟨, orange 🟧, red 🟥.
- localStorage schema version: `1`. On corrupt JSON or mismatch, return empty state.
- Mobile-first responsive layout, single column, `max-width: 520px`, must read down to 320px wide.
- All pure modules (scoring, selectPuzzle, reducer, formatShare) must have no side effects and no `Date.now()` / `window` access. Time/URL/storage are passed in.

## File Structure

Files this plan creates:

- `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html` — scaffolding.
- `src/main.tsx` — entry point, mounts `<App/>`.
- `src/App.tsx` — top-level component, owns reducer, dispatches I/O.
- `src/game/types.ts` — shared TypeScript types.
- `src/game/eras.ts` — era → range table + lookup helpers.
- `src/game/scoring.ts` — pure: `(guess, answer, era) → { distanceRatio, bucket }`.
- `src/game/selectPuzzle.ts` — pure: `(todayIso, schedule, puzzles) → Puzzle | null`.
- `src/game/reducer.ts` — pure state machine.
- `src/game/today.ts` — boundary: `today(): "YYYY-MM-DD"` using `Intl`.
- `src/storage/localStorage.ts` — boundary: `load() / save()` with schema versioning.
- `src/share/formatShare.ts` — pure: `(state, puzzleNumber, url) → string`.
- `src/ui/Board.tsx`, `Hints.tsx`, `GuessInput.tsx`, `GuessTiles.tsx`, `ColorLegend.tsx`, `EraPill.tsx`, `ShareButton.tsx`, `StatsModal.tsx`, `Screen.module.css`, `*.module.css` per component.
- `src/content/puzzles.json`, `src/content/schedule.json`.
- Test files alongside in `__tests__/` folders.
- `.github/workflows/deploy.yml` — build + deploy to GitHub Pages.

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a runnable Vite + React + TS + Vitest project. `App` renders the literal string "Daily Year". `npm test` and `npm run build` both succeed.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "daily-year",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Write `vite.config.ts`**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/daily-year/",
});
```

- [ ] **Step 4: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
  },
});
```

- [ ] **Step 5: Write `src/test-setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 6: Write `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Daily Year</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Write `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 8: Write `src/main.tsx`**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 9: Write `src/App.tsx`**

```tsx
export function App() {
  return <div>Daily Year</div>;
}
```

- [ ] **Step 10: Install and verify**

Run: `npm install && npm test && npm run build`
Expected: install succeeds; `npm test` reports "No test files found, exiting with code 0" — that's fine because we pass no tests yet. If Vitest exits non-zero on no tests, add `passWithNoTests: true` to `vitest.config.ts` under `test:` and rerun. Build emits `dist/` with `index.html`.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts vitest.config.ts index.html src/
git commit -m "scaffold: Vite + React + TS + Vitest project"
```

---

## Task 2: Types and Eras Table

**Files:**
- Create: `src/game/types.ts`, `src/game/eras.ts`, `src/game/__tests__/eras.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `Era = "prehistory" | "ancient" | "medieval" | "modern" | "recent"`
  - `Bucket = "perfect" | "green" | "lime" | "yellow" | "orange" | "red"`
  - `Puzzle = { id: string; era: Era; answer: number; hints: [string, string, string, string, string] }`
  - `Schedule = Record<string, string>` (date → puzzle id)
  - `Guess = { year: number; bucket: Bucket; distanceRatio: number }`
  - `GameState = { puzzle: Puzzle; guesses: Guess[]; outcome: "playing" | "won" | "lost"; hintsRevealed: number }`
  - `Stats = { currentStreak: number; maxStreak: number; lastWinDate: string | null }`
  - `eraRange(era: Era, currentYear: number): { from: number; to: number; width: number }` — `to` is exclusive except for `recent` which is inclusive (so the function exposes `to` as `currentYear + 1` for `recent` to keep half-open math).

- [ ] **Step 1: Write the failing test in `src/game/__tests__/eras.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { eraRange } from "../eras";

describe("eraRange", () => {
  it("returns the prehistory range", () => {
    expect(eraRange("prehistory", 2026)).toEqual({ from: -3000, to: -753, width: 2247 });
  });

  it("returns the ancient range", () => {
    expect(eraRange("ancient", 2026)).toEqual({ from: -753, to: 476, width: 1229 });
  });

  it("returns the medieval range", () => {
    expect(eraRange("medieval", 2026)).toEqual({ from: 476, to: 1453, width: 977 });
  });

  it("returns the modern range", () => {
    expect(eraRange("modern", 2026)).toEqual({ from: 1453, to: 1789, width: 336 });
  });

  it("returns the recent range up to currentYear+1", () => {
    expect(eraRange("recent", 2026)).toEqual({ from: 1789, to: 2027, width: 238 });
  });

  it("scales recent.to with currentYear", () => {
    expect(eraRange("recent", 2030)).toEqual({ from: 1789, to: 2031, width: 242 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- eras`
Expected: FAIL with "Cannot find module '../eras'".

- [ ] **Step 3: Write `src/game/types.ts`**

```ts
export type Era = "prehistory" | "ancient" | "medieval" | "modern" | "recent";

export type Bucket = "perfect" | "green" | "lime" | "yellow" | "orange" | "red";

export type Puzzle = {
  id: string;
  era: Era;
  answer: number;
  hints: [string, string, string, string, string];
};

export type Schedule = Record<string, string>;

export type Guess = {
  year: number;
  bucket: Bucket;
  distanceRatio: number;
};

export type Outcome = "playing" | "won" | "lost";

export type GameState = {
  puzzle: Puzzle;
  guesses: Guess[];
  outcome: Outcome;
  hintsRevealed: number;
};

export type Stats = {
  currentStreak: number;
  maxStreak: number;
  lastWinDate: string | null;
};
```

- [ ] **Step 4: Write `src/game/eras.ts`**

```ts
import { Era } from "./types";

const TABLE: Record<Era, { from: number; to: number | "currentYearInclusive" }> = {
  prehistory: { from: -3000, to: -753 },
  ancient: { from: -753, to: 476 },
  medieval: { from: 476, to: 1453 },
  modern: { from: 1453, to: 1789 },
  recent: { from: 1789, to: "currentYearInclusive" },
};

export function eraRange(era: Era, currentYear: number): { from: number; to: number; width: number } {
  const entry = TABLE[era];
  const to = entry.to === "currentYearInclusive" ? currentYear + 1 : entry.to;
  return { from: entry.from, to, width: to - entry.from };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- eras`
Expected: 6 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/game/types.ts src/game/eras.ts src/game/__tests__/eras.test.ts
git commit -m "feat(game): era range table and shared types"
```

---

## Task 3: Scoring

**Files:**
- Create: `src/game/scoring.ts`, `src/game/__tests__/scoring.test.ts`

**Interfaces:**
- Consumes: `eraRange` from `eras.ts`, `Era`, `Bucket` from `types.ts`.
- Produces: `scoreGuess(guess: number, answer: number, era: Era, currentYear: number): { distanceRatio: number; bucket: Bucket }`. Pure.

- [ ] **Step 1: Write the failing test in `src/game/__tests__/scoring.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { scoreGuess } from "../scoring";

describe("scoreGuess", () => {
  it("returns perfect for an exact match", () => {
    const result = scoreGuess(1571, 1571, "modern", 2026);
    expect(result).toEqual({ distanceRatio: 0, bucket: "perfect" });
  });

  it("computes distanceRatio as d/W in modern era", () => {
    const result = scoreGuess(1500, 1571, "modern", 2026);
    expect(result.distanceRatio).toBeCloseTo(71 / 336, 5);
  });

  it("caps distanceRatio at 1", () => {
    const result = scoreGuess(1453, 2026, "recent", 2026);
    expect(result.distanceRatio).toBe(1);
    expect(result.bucket).toBe("red");
  });

  it("returns green for d <= 0.01 * W", () => {
    const result = scoreGuess(1574, 1571, "modern", 2026);
    expect(result.bucket).toBe("green");
  });

  it("returns lime for 0.01W < d <= 0.05W", () => {
    const result = scoreGuess(1582, 1571, "modern", 2026);
    expect(result.bucket).toBe("lime");
  });

  it("returns yellow for 0.05W < d <= 0.15W", () => {
    const result = scoreGuess(1600, 1571, "modern", 2026);
    expect(result.bucket).toBe("yellow");
  });

  it("returns orange for 0.15W < d <= 0.40W", () => {
    const result = scoreGuess(1700, 1571, "modern", 2026);
    expect(result.bucket).toBe("orange");
  });

  it("returns red for d > 0.40W", () => {
    const result = scoreGuess(1500, 1700, "modern", 2026);
    expect(result.bucket).toBe("red");
  });

  it("handles negative-year answers (BCE)", () => {
    const result = scoreGuess(-1000, -1000, "ancient", 2026);
    expect(result).toEqual({ distanceRatio: 0, bucket: "perfect" });
  });

  it("computes distance correctly across BCE/CE boundary", () => {
    const result = scoreGuess(-10, 10, "ancient", 2026);
    expect(result.distanceRatio).toBeCloseTo(20 / 1229, 5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scoring`
Expected: FAIL with "Cannot find module '../scoring'".

- [ ] **Step 3: Write `src/game/scoring.ts`**

```ts
import { Bucket, Era } from "./types";
import { eraRange } from "./eras";

const THRESHOLDS: { bucket: Bucket; max: number }[] = [
  { bucket: "perfect", max: 0 },
  { bucket: "green", max: 0.01 },
  { bucket: "lime", max: 0.05 },
  { bucket: "yellow", max: 0.15 },
  { bucket: "orange", max: 0.40 },
];

export function scoreGuess(
  guess: number,
  answer: number,
  era: Era,
  currentYear: number,
): { distanceRatio: number; bucket: Bucket } {
  const { width } = eraRange(era, currentYear);
  const d = Math.abs(guess - answer);
  const distanceRatio = Math.min(d / width, 1);

  if (d === 0) return { distanceRatio: 0, bucket: "perfect" };
  for (const { bucket, max } of THRESHOLDS) {
    if (bucket !== "perfect" && distanceRatio <= max) return { distanceRatio, bucket };
  }
  return { distanceRatio, bucket: "red" };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- scoring`
Expected: 10 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/scoring.ts src/game/__tests__/scoring.test.ts
git commit -m "feat(game): scoring with continuous ratio and discrete buckets"
```

---

## Task 4: selectPuzzle

**Files:**
- Create: `src/game/selectPuzzle.ts`, `src/game/__tests__/selectPuzzle.test.ts`

**Interfaces:**
- Consumes: `Puzzle`, `Schedule` from `types.ts`.
- Produces: `selectPuzzle(todayIso: string, schedule: Schedule, puzzles: Puzzle[]): Puzzle | null`. Pure.

- [ ] **Step 1: Write the failing test in `src/game/__tests__/selectPuzzle.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { selectPuzzle } from "../selectPuzzle";
import { Puzzle } from "../types";

const lepanto: Puzzle = {
  id: "lepanto-1571",
  era: "modern",
  answer: 1571,
  hints: ["a", "b", "c", "d", "e"],
};

const moonLanding: Puzzle = {
  id: "moon-landing-1969",
  era: "recent",
  answer: 1969,
  hints: ["a", "b", "c", "d", "e"],
};

describe("selectPuzzle", () => {
  it("returns the puzzle scheduled for today", () => {
    const schedule = { "2026-06-19": "lepanto-1571", "2026-06-20": "moon-landing-1969" };
    expect(selectPuzzle("2026-06-19", schedule, [lepanto, moonLanding])).toBe(lepanto);
  });

  it("returns null when today is not in the schedule", () => {
    const schedule = { "2026-06-19": "lepanto-1571" };
    expect(selectPuzzle("2026-06-20", schedule, [lepanto])).toBeNull();
  });

  it("returns null when the scheduled id has no matching puzzle", () => {
    const schedule = { "2026-06-19": "missing-id" };
    expect(selectPuzzle("2026-06-19", schedule, [lepanto])).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- selectPuzzle`
Expected: FAIL with "Cannot find module '../selectPuzzle'".

- [ ] **Step 3: Write `src/game/selectPuzzle.ts`**

```ts
import { Puzzle, Schedule } from "./types";

export function selectPuzzle(todayIso: string, schedule: Schedule, puzzles: Puzzle[]): Puzzle | null {
  const id = schedule[todayIso];
  if (!id) return null;
  return puzzles.find((p) => p.id === id) ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- selectPuzzle`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/selectPuzzle.ts src/game/__tests__/selectPuzzle.test.ts
git commit -m "feat(game): puzzle selection by date"
```

---

## Task 5: puzzleNumber helper

**Files:**
- Create: `src/game/puzzleNumber.ts`, `src/game/__tests__/puzzleNumber.test.ts`

**Interfaces:**
- Consumes: `Schedule` from `types.ts`.
- Produces: `puzzleNumberFor(todayIso: string, schedule: Schedule): number | null` — the 1-based index of `todayIso` in the chronologically-sorted keys of `schedule`. Returns `null` if `todayIso` is not in the schedule.

- [ ] **Step 1: Write the failing test in `src/game/__tests__/puzzleNumber.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { puzzleNumberFor } from "../puzzleNumber";

describe("puzzleNumberFor", () => {
  it("returns 1 for the earliest scheduled date", () => {
    const schedule = { "2026-06-19": "a", "2026-06-20": "b", "2026-06-21": "c" };
    expect(puzzleNumberFor("2026-06-19", schedule)).toBe(1);
  });

  it("returns the 1-based index in chronological order", () => {
    const schedule = { "2026-06-21": "c", "2026-06-19": "a", "2026-06-20": "b" };
    expect(puzzleNumberFor("2026-06-21", schedule)).toBe(3);
  });

  it("returns null when date is not in schedule", () => {
    const schedule = { "2026-06-19": "a" };
    expect(puzzleNumberFor("2026-06-20", schedule)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- puzzleNumber`
Expected: FAIL with "Cannot find module '../puzzleNumber'".

- [ ] **Step 3: Write `src/game/puzzleNumber.ts`**

```ts
import { Schedule } from "./types";

export function puzzleNumberFor(todayIso: string, schedule: Schedule): number | null {
  const sortedDates = Object.keys(schedule).sort();
  const index = sortedDates.indexOf(todayIso);
  return index === -1 ? null : index + 1;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- puzzleNumber`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/puzzleNumber.ts src/game/__tests__/puzzleNumber.test.ts
git commit -m "feat(game): puzzle number from schedule order"
```

---

## Task 6: Reducer

**Files:**
- Create: `src/game/reducer.ts`, `src/game/__tests__/reducer.test.ts`

**Interfaces:**
- Consumes: `GameState`, `Guess`, `Puzzle`, `Era` from `types.ts`; `scoreGuess` from `scoring.ts`.
- Produces:
  - `initialState(puzzle: Puzzle): GameState` — `{ puzzle, guesses: [], outcome: "playing", hintsRevealed: 1 }`.
  - `Action = { type: "submitGuess"; year: number; currentYear: number }`.
  - `reducer(state: GameState, action: Action): GameState` — pure. Adds the guess; sets `outcome: "won"` if exact; otherwise reveals next hint; sets `outcome: "lost"` after 5 guesses. Once `outcome !== "playing"`, further `submitGuess` actions are ignored (return same state).

- [ ] **Step 1: Write the failing test in `src/game/__tests__/reducer.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { reducer, initialState } from "../reducer";
import { Puzzle } from "../types";

const lepanto: Puzzle = {
  id: "lepanto-1571",
  era: "modern",
  answer: 1571,
  hints: ["h1", "h2", "h3", "h4", "h5"],
};

describe("initialState", () => {
  it("starts with one hint revealed and no guesses", () => {
    expect(initialState(lepanto)).toEqual({
      puzzle: lepanto,
      guesses: [],
      outcome: "playing",
      hintsRevealed: 1,
    });
  });
});

describe("reducer", () => {
  it("appends a wrong guess and reveals the next hint", () => {
    const next = reducer(initialState(lepanto), { type: "submitGuess", year: 1500, currentYear: 2026 });
    expect(next.guesses).toHaveLength(1);
    expect(next.guesses[0].year).toBe(1500);
    expect(next.guesses[0].bucket).toBe("orange");
    expect(next.hintsRevealed).toBe(2);
    expect(next.outcome).toBe("playing");
  });

  it("sets outcome to won on an exact guess", () => {
    const next = reducer(initialState(lepanto), { type: "submitGuess", year: 1571, currentYear: 2026 });
    expect(next.outcome).toBe("won");
    expect(next.guesses[0].bucket).toBe("perfect");
  });

  it("sets outcome to lost after the 5th wrong guess", () => {
    let state = initialState(lepanto);
    for (const y of [1500, 1600, 1700, 1455, 1788]) {
      state = reducer(state, { type: "submitGuess", year: y, currentYear: 2026 });
    }
    expect(state.guesses).toHaveLength(5);
    expect(state.outcome).toBe("lost");
  });

  it("ignores further guesses after the game ends", () => {
    let state = initialState(lepanto);
    state = reducer(state, { type: "submitGuess", year: 1571, currentYear: 2026 });
    const after = reducer(state, { type: "submitGuess", year: 1500, currentYear: 2026 });
    expect(after).toBe(state);
  });

  it("caps hintsRevealed at 5", () => {
    let state = initialState(lepanto);
    for (const y of [1500, 1600, 1700, 1455]) {
      state = reducer(state, { type: "submitGuess", year: y, currentYear: 2026 });
    }
    expect(state.hintsRevealed).toBe(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- reducer`
Expected: FAIL with "Cannot find module '../reducer'".

- [ ] **Step 3: Write `src/game/reducer.ts`**

```ts
import { GameState, Puzzle } from "./types";
import { scoreGuess } from "./scoring";

export type Action = { type: "submitGuess"; year: number; currentYear: number };

export function initialState(puzzle: Puzzle): GameState {
  return { puzzle, guesses: [], outcome: "playing", hintsRevealed: 1 };
}

export function reducer(state: GameState, action: Action): GameState {
  if (state.outcome !== "playing") return state;
  if (action.type !== "submitGuess") return state;

  const { distanceRatio, bucket } = scoreGuess(
    action.year,
    state.puzzle.answer,
    state.puzzle.era,
    action.currentYear,
  );
  const guesses = [...state.guesses, { year: action.year, distanceRatio, bucket }];

  if (bucket === "perfect") {
    return { ...state, guesses, outcome: "won", hintsRevealed: state.hintsRevealed };
  }
  if (guesses.length >= 5) {
    return { ...state, guesses, outcome: "lost", hintsRevealed: 5 };
  }
  return { ...state, guesses, hintsRevealed: Math.min(state.hintsRevealed + 1, 5) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- reducer`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/reducer.ts src/game/__tests__/reducer.test.ts
git commit -m "feat(game): pure game state reducer"
```

---

## Task 7: today() boundary

**Files:**
- Create: `src/game/today.ts`, `src/game/__tests__/today.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `today(now?: Date): string` — returns `YYYY-MM-DD` for `now` (default: `new Date()`) in `America/Argentina/Buenos_Aires`. `currentYearArt(now?: Date): number` — returns the 4-digit year as integer.

- [ ] **Step 1: Write the failing test in `src/game/__tests__/today.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { today, currentYearArt } from "../today";

describe("today", () => {
  it("returns YYYY-MM-DD for a given UTC instant in Buenos Aires time", () => {
    // 2026-06-19 02:00 UTC == 2026-06-18 23:00 ART
    expect(today(new Date("2026-06-19T02:00:00Z"))).toBe("2026-06-18");
  });

  it("returns the next day after midnight ART", () => {
    // 2026-06-19 04:00 UTC == 2026-06-19 01:00 ART
    expect(today(new Date("2026-06-19T04:00:00Z"))).toBe("2026-06-19");
  });
});

describe("currentYearArt", () => {
  it("returns the 4-digit year", () => {
    expect(currentYearArt(new Date("2026-06-19T12:00:00Z"))).toBe(2026);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- today`
Expected: FAIL with "Cannot find module '../today'".

- [ ] **Step 3: Write `src/game/today.ts`**

```ts
const FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function today(now: Date = new Date()): string {
  return FORMATTER.format(now);
}

export function currentYearArt(now: Date = new Date()): number {
  return Number(today(now).slice(0, 4));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- today`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/today.ts src/game/__tests__/today.test.ts
git commit -m "feat(game): today() boundary using ART timezone"
```

---

## Task 8: localStorage boundary

**Files:**
- Create: `src/storage/localStorage.ts`, `src/storage/__tests__/localStorage.test.ts`

**Interfaces:**
- Consumes: `GameState`, `Stats` from `types.ts`.
- Produces:
  - `PersistedShape = { schemaVersion: 1; lastPlayedDate: string | null; lastResult: GameState | null; stats: Stats }`
  - `EMPTY: PersistedShape` — `{ schemaVersion: 1, lastPlayedDate: null, lastResult: null, stats: { currentStreak: 0, maxStreak: 0, lastWinDate: null } }`
  - `load(storage: Storage): PersistedShape` — reads from `storage.getItem("daily-year")`; returns `EMPTY` if missing, corrupt, or wrong schema version.
  - `save(storage: Storage, data: PersistedShape): void` — writes to `storage.setItem("daily-year", JSON.stringify(data))`.

- [ ] **Step 1: Write the failing test in `src/storage/__tests__/localStorage.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { load, save, EMPTY } from "../localStorage";

function makeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
    key: () => null,
    length: 0,
  } as Storage;
}

describe("localStorage boundary", () => {
  let storage: Storage;
  beforeEach(() => {
    storage = makeStorage();
  });

  it("load returns EMPTY when nothing is stored", () => {
    expect(load(storage)).toEqual(EMPTY);
  });

  it("load returns EMPTY when stored JSON is corrupt", () => {
    storage.setItem("daily-year", "not json{");
    expect(load(storage)).toEqual(EMPTY);
  });

  it("load returns EMPTY when schemaVersion does not match", () => {
    storage.setItem("daily-year", JSON.stringify({ schemaVersion: 99, foo: "bar" }));
    expect(load(storage)).toEqual(EMPTY);
  });

  it("save then load round-trips the data", () => {
    const data = { ...EMPTY, lastPlayedDate: "2026-06-19", stats: { currentStreak: 3, maxStreak: 7, lastWinDate: "2026-06-19" } };
    save(storage, data);
    expect(load(storage)).toEqual(data);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- localStorage`
Expected: FAIL with "Cannot find module '../localStorage'".

- [ ] **Step 3: Write `src/storage/localStorage.ts`**

```ts
import { GameState, Stats } from "../game/types";

const KEY = "daily-year";

export type PersistedShape = {
  schemaVersion: 1;
  lastPlayedDate: string | null;
  lastResult: GameState | null;
  stats: Stats;
};

export const EMPTY: PersistedShape = {
  schemaVersion: 1,
  lastPlayedDate: null,
  lastResult: null,
  stats: { currentStreak: 0, maxStreak: 0, lastWinDate: null },
};

export function load(storage: Storage): PersistedShape {
  const raw = storage.getItem(KEY);
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.schemaVersion !== 1) return EMPTY;
    return parsed as PersistedShape;
  } catch {
    return EMPTY;
  }
}

export function save(storage: Storage, data: PersistedShape): void {
  storage.setItem(KEY, JSON.stringify(data));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- localStorage`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/storage/localStorage.ts src/storage/__tests__/localStorage.test.ts
git commit -m "feat(storage): localStorage boundary with schema versioning"
```

---

## Task 9: Streak updater

**Files:**
- Create: `src/game/streak.ts`, `src/game/__tests__/streak.test.ts`

**Interfaces:**
- Consumes: `Stats` from `types.ts`.
- Produces: `applyResult(stats: Stats, outcome: "won" | "lost", todayIso: string): Stats` — pure. On win, increments streak if `lastWinDate` is yesterday relative to `todayIso`, else resets to 1; updates `lastWinDate` and `maxStreak`. On loss, resets `currentStreak` to 0; leaves `lastWinDate` and `maxStreak` alone.

- [ ] **Step 1: Write the failing test in `src/game/__tests__/streak.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { applyResult } from "../streak";

describe("applyResult", () => {
  it("starts a streak at 1 on first win", () => {
    expect(applyResult({ currentStreak: 0, maxStreak: 0, lastWinDate: null }, "won", "2026-06-19"))
      .toEqual({ currentStreak: 1, maxStreak: 1, lastWinDate: "2026-06-19" });
  });

  it("extends the streak when lastWinDate is yesterday", () => {
    expect(applyResult({ currentStreak: 4, maxStreak: 4, lastWinDate: "2026-06-18" }, "won", "2026-06-19"))
      .toEqual({ currentStreak: 5, maxStreak: 5, lastWinDate: "2026-06-19" });
  });

  it("resets to 1 when there is a gap day", () => {
    expect(applyResult({ currentStreak: 4, maxStreak: 6, lastWinDate: "2026-06-17" }, "won", "2026-06-19"))
      .toEqual({ currentStreak: 1, maxStreak: 6, lastWinDate: "2026-06-19" });
  });

  it("keeps maxStreak as the previous max if not exceeded", () => {
    expect(applyResult({ currentStreak: 2, maxStreak: 10, lastWinDate: "2026-06-18" }, "won", "2026-06-19"))
      .toEqual({ currentStreak: 3, maxStreak: 10, lastWinDate: "2026-06-19" });
  });

  it("resets currentStreak to 0 on a loss and keeps lastWinDate/maxStreak", () => {
    expect(applyResult({ currentStreak: 4, maxStreak: 6, lastWinDate: "2026-06-18" }, "lost", "2026-06-19"))
      .toEqual({ currentStreak: 0, maxStreak: 6, lastWinDate: "2026-06-18" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- streak`
Expected: FAIL with "Cannot find module '../streak'".

- [ ] **Step 3: Write `src/game/streak.ts`**

```ts
import { Stats } from "./types";

function yesterdayIso(todayIso: string): string {
  const [y, m, d] = todayIso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function applyResult(stats: Stats, outcome: "won" | "lost", todayIso: string): Stats {
  if (outcome === "lost") {
    return { ...stats, currentStreak: 0 };
  }
  const extending = stats.lastWinDate === yesterdayIso(todayIso);
  const currentStreak = extending ? stats.currentStreak + 1 : 1;
  return {
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    lastWinDate: todayIso,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- streak`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/streak.ts src/game/__tests__/streak.test.ts
git commit -m "feat(game): streak update logic"
```

---

## Task 10: formatShare

**Files:**
- Create: `src/share/formatShare.ts`, `src/share/__tests__/formatShare.test.ts`

**Interfaces:**
- Consumes: `GameState` from `types.ts`.
- Produces: `formatShare(state: GameState, puzzleNumber: number, url: string): string`. Pure. Format:
  - line 1: `Daily Year #{N} — {G}/5 {emojiRow}` where `G` is `guesses.length` on win, `X` on loss.
  - line 2: `play at {url}`.
  - Emoji mapping: `perfect→🟡`, `green→🟢`, `lime→🟩`, `yellow→🟨`, `orange→🟧`, `red→🟥`.

- [ ] **Step 1: Write the failing test in `src/share/__tests__/formatShare.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { formatShare } from "../formatShare";
import { GameState } from "../../game/types";

const winState: GameState = {
  puzzle: { id: "lepanto-1571", era: "modern", answer: 1571, hints: ["a", "b", "c", "d", "e"] },
  guesses: [
    { year: 1500, distanceRatio: 0.21, bucket: "orange" },
    { year: 1600, distanceRatio: 0.08, bucket: "yellow" },
    { year: 1571, distanceRatio: 0, bucket: "perfect" },
  ],
  outcome: "won",
  hintsRevealed: 3,
};

const lossState: GameState = {
  ...winState,
  guesses: [
    { year: 1500, distanceRatio: 0.21, bucket: "orange" },
    { year: 1600, distanceRatio: 0.08, bucket: "yellow" },
    { year: 1700, distanceRatio: 0.38, bucket: "orange" },
    { year: 1455, distanceRatio: 0.34, bucket: "orange" },
    { year: 1755, distanceRatio: 0.54, bucket: "red" },
  ],
  outcome: "lost",
};

describe("formatShare", () => {
  it("formats a win", () => {
    expect(formatShare(winState, 42, "https://example.com/daily-year/")).toBe(
      "Daily Year #42 — 3/5 🟧🟨🟡\nplay at https://example.com/daily-year/",
    );
  });

  it("formats a loss with X/5", () => {
    expect(formatShare(lossState, 42, "https://example.com/daily-year/")).toBe(
      "Daily Year #42 — X/5 🟧🟨🟧🟧🟥\nplay at https://example.com/daily-year/",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- formatShare`
Expected: FAIL with "Cannot find module '../formatShare'".

- [ ] **Step 3: Write `src/share/formatShare.ts`**

```ts
import { Bucket, GameState } from "../game/types";

const EMOJI: Record<Bucket, string> = {
  perfect: "🟡",
  green: "🟢",
  lime: "🟩",
  yellow: "🟨",
  orange: "🟧",
  red: "🟥",
};

export function formatShare(state: GameState, puzzleNumber: number, url: string): string {
  const score = state.outcome === "won" ? `${state.guesses.length}/5` : "X/5";
  const row = state.guesses.map((g) => EMOJI[g.bucket]).join("");
  return `Daily Year #${puzzleNumber} — ${score} ${row}\nplay at ${url}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- formatShare`
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/share/formatShare.ts src/share/__tests__/formatShare.test.ts
git commit -m "feat(share): Wordle-style share string"
```

---

## Task 11: Content seed

**Files:**
- Create: `src/content/puzzles.json`, `src/content/schedule.json`

**Interfaces:**
- Consumes: nothing.
- Produces: Two static JSON files importable by `App.tsx`. Schedules at least one puzzle for today's date in ART.

- [ ] **Step 1: Write `src/content/puzzles.json`**

```json
[
  {
    "id": "lepanto-1571",
    "era": "modern",
    "answer": 1571,
    "hints": [
      "A modern age war involving the Ottoman empire occurred this year",
      "More than a century before the Byzantine empire fell",
      "The Holy League regained Christian control in the Mediterranean",
      "A Spaniard was inspired to write a satire of chivalric romances of the time",
      "400 years later Led Zeppelin released 'Stairway to Heaven'"
    ]
  },
  {
    "id": "moon-landing-1969",
    "era": "recent",
    "answer": 1969,
    "hints": [
      "A milestone year for spaceflight",
      "Two superpowers were locked in a long political standoff",
      "A US president had promised this would happen before the decade ended",
      "Neil Armstrong said something memorable about a small step",
      "Months later, Woodstock drew half a million people to a dairy farm"
    ]
  },
  {
    "id": "magna-carta-1215",
    "era": "medieval",
    "answer": 1215,
    "hints": [
      "An English king bowed to his barons this year",
      "A foundational document of constitutional law was sealed at a meadow by the Thames",
      "King John was the unwilling signatory",
      "The Fourth Lateran Council also took place in the same year",
      "Eight centuries later it is still cited as a constitutional touchstone"
    ]
  }
]
```

- [ ] **Step 2: Write `src/content/schedule.json`**

Replace the dates with today and the next two days in ART when implementing — the dates below are illustrative anchors. If today is past the dates listed, extend the schedule forward.

```json
{
  "2026-06-19": "lepanto-1571",
  "2026-06-20": "moon-landing-1969",
  "2026-06-21": "magna-carta-1215"
}
```

- [ ] **Step 3: Commit**

```bash
git add src/content/
git commit -m "content: seed puzzles and schedule"
```

---

## Task 12: Color computation helper

**Files:**
- Create: `src/ui/color.ts`, `src/ui/__tests__/color.test.ts`

**Interfaces:**
- Consumes: `Guess` from `../game/types.ts`.
- Produces: `colorFor(guess: Guess): string` — returns a CSS color string. Perfect → gold `hsl(45, 90%, 55%)`. Otherwise HSL hue lerp from green (120°) at ratio 0 to red (0°) at ratio 1, fixed saturation 65% lightness 50%: `hsl(${120 * (1 - ratio)}, 65%, 50%)`.

- [ ] **Step 1: Write the failing test in `src/ui/__tests__/color.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { colorFor } from "../color";

describe("colorFor", () => {
  it("returns gold for a perfect guess", () => {
    expect(colorFor({ year: 1571, distanceRatio: 0, bucket: "perfect" })).toBe("hsl(45, 90%, 55%)");
  });

  it("returns pure green at distanceRatio 0 (non-perfect)", () => {
    // ratio 0 but bucket green can happen only at d=0 which is "perfect", so this is theoretical;
    // we still want the formula to behave at the lerp endpoints.
    expect(colorFor({ year: 1571, distanceRatio: 0, bucket: "green" })).toBe("hsl(120, 65%, 50%)");
  });

  it("returns pure red at distanceRatio 1", () => {
    expect(colorFor({ year: 1700, distanceRatio: 1, bucket: "red" })).toBe("hsl(0, 65%, 50%)");
  });

  it("interpolates linearly at ratio 0.5", () => {
    expect(colorFor({ year: 1600, distanceRatio: 0.5, bucket: "yellow" })).toBe("hsl(60, 65%, 50%)");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- color`
Expected: FAIL with "Cannot find module '../color'".

- [ ] **Step 3: Write `src/ui/color.ts`**

```ts
import { Guess } from "../game/types";

export function colorFor(guess: Guess): string {
  if (guess.bucket === "perfect") return "hsl(45, 90%, 55%)";
  const hue = 120 * (1 - guess.distanceRatio);
  return `hsl(${hue}, 65%, 50%)`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- color`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/ui/color.ts src/ui/__tests__/color.test.ts
git commit -m "feat(ui): continuous HSL color from distance ratio"
```

---

## Task 13: UI primitives — Hints, GuessTiles, ColorLegend, EraPill

**Files:**
- Create: `src/ui/Hints.tsx`, `src/ui/Hints.module.css`, `src/ui/GuessTiles.tsx`, `src/ui/GuessTiles.module.css`, `src/ui/ColorLegend.tsx`, `src/ui/ColorLegend.module.css`, `src/ui/EraPill.tsx`, `src/ui/EraPill.module.css`
- Test: `src/ui/__tests__/Hints.test.tsx`, `src/ui/__tests__/GuessTiles.test.tsx`

**Interfaces:**
- Consumes: `Guess`, `Era` from `../game/types.ts`; `colorFor` from `./color.ts`.
- Produces:
  - `Hints({ hints, revealed }: { hints: string[]; revealed: number }): JSX.Element` — renders all hints; the first `revealed` are visible text, the rest are "Locked — guess to reveal" placeholders with reduced opacity.
  - `GuessTiles({ guesses }: { guesses: Guess[] }): JSX.Element` — 5 tiles total. Each filled tile shows the year and uses `colorFor(guess)` as background. Empty tiles are dashed-outline placeholders.
  - `ColorLegend(): JSX.Element` — a horizontal gradient bar with three labels: "far off", "closer", "exact".
  - `EraPill({ era }: { era: Era }): JSX.Element` — pill displaying the era label (uppercased).

- [ ] **Step 1: Write the failing test in `src/ui/__tests__/Hints.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hints } from "../Hints";

describe("Hints", () => {
  it("shows the first N hints and locks the rest", () => {
    render(<Hints hints={["h1", "h2", "h3", "h4", "h5"]} revealed={2} />);
    expect(screen.getByText("h1")).toBeInTheDocument();
    expect(screen.getByText("h2")).toBeInTheDocument();
    expect(screen.queryByText("h3")).not.toBeInTheDocument();
    const locked = screen.getAllByText(/locked/i);
    expect(locked).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Hints`
Expected: FAIL with "Cannot find module '../Hints'".

- [ ] **Step 3: Write `src/ui/Hints.module.css`**

```css
.list { margin: 16px 0; }
.hint {
  padding: 10px 14px;
  margin-bottom: 8px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
}
.locked {
  background: #f3f3f3;
  color: #bbb;
  font-style: italic;
}
.num {
  display: inline-block;
  width: 22px;
  height: 22px;
  line-height: 22px;
  text-align: center;
  background: #333;
  color: #fff;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 600;
  margin-right: 8px;
}
.numLocked { background: #ccc; }
```

- [ ] **Step 4: Write `src/ui/Hints.tsx`**

```tsx
import styles from "./Hints.module.css";

export function Hints({ hints, revealed }: { hints: string[]; revealed: number }) {
  return (
    <div className={styles.list}>
      {hints.map((text, i) => {
        const locked = i >= revealed;
        return (
          <div key={i} className={`${styles.hint} ${locked ? styles.locked : ""}`}>
            <span className={`${styles.num} ${locked ? styles.numLocked : ""}`}>{i + 1}</span>
            {locked ? "Locked — guess to reveal" : text}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Run Hints test to verify it passes**

Run: `npm test -- Hints`
Expected: 1 test passes.

- [ ] **Step 6: Write the failing test in `src/ui/__tests__/GuessTiles.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GuessTiles } from "../GuessTiles";

describe("GuessTiles", () => {
  it("renders 5 tiles, filling submitted guesses and leaving the rest empty", () => {
    render(
      <GuessTiles
        guesses={[
          { year: 1500, distanceRatio: 0.21, bucket: "orange" },
          { year: 1600, distanceRatio: 0.08, bucket: "yellow" },
        ]}
      />,
    );
    expect(screen.getByText("1500")).toBeInTheDocument();
    expect(screen.getByText("1600")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(3);
  });

  it("applies an inline background color to a filled tile", () => {
    const { container } = render(
      <GuessTiles guesses={[{ year: 1571, distanceRatio: 0, bucket: "perfect" }]} />,
    );
    const filled = container.querySelector("[data-filled='true']") as HTMLElement;
    expect(filled.style.background).toBe("hsl(45, 90%, 55%)");
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npm test -- GuessTiles`
Expected: FAIL with "Cannot find module '../GuessTiles'".

- [ ] **Step 8: Write `src/ui/GuessTiles.module.css`**

```css
.row { display: flex; gap: 8px; margin: 16px 0 8px; }
.tile {
  flex: 1;
  height: 44px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #fff;
  font-size: 16px;
}
.empty {
  background: #fff;
  border: 1.5px dashed #ddd;
  color: #ccc;
}
```

- [ ] **Step 9: Write `src/ui/GuessTiles.tsx`**

```tsx
import { Guess } from "../game/types";
import { colorFor } from "./color";
import styles from "./GuessTiles.module.css";

export function GuessTiles({ guesses }: { guesses: Guess[] }) {
  const tiles = [0, 1, 2, 3, 4].map((i) => guesses[i] ?? null);
  return (
    <div className={styles.row}>
      {tiles.map((g, i) =>
        g ? (
          <div
            key={i}
            data-filled="true"
            className={styles.tile}
            style={{ background: colorFor(g) }}
          >
            {g.year}
          </div>
        ) : (
          <div key={i} className={`${styles.tile} ${styles.empty}`}>—</div>
        ),
      )}
    </div>
  );
}
```

- [ ] **Step 10: Run GuessTiles test to verify it passes**

Run: `npm test -- GuessTiles`
Expected: 2 tests pass.

- [ ] **Step 11: Write `src/ui/ColorLegend.module.css`**

```css
.bar {
  display: flex;
  margin: 16px 0 6px;
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
  background: linear-gradient(to right, hsl(0, 65%, 50%), hsl(60, 65%, 50%), hsl(120, 65%, 50%));
}
.labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #888;
}
```

- [ ] **Step 12: Write `src/ui/ColorLegend.tsx`**

```tsx
import styles from "./ColorLegend.module.css";

export function ColorLegend() {
  return (
    <div>
      <div className={styles.bar} />
      <div className={styles.labels}>
        <span>far off</span>
        <span>closer</span>
        <span>exact</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 13: Write `src/ui/EraPill.module.css`**

```css
.pill {
  display: inline-block;
  padding: 2px 10px;
  background: #f0e8d8;
  color: #8a6d3b;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

- [ ] **Step 14: Write `src/ui/EraPill.tsx`**

```tsx
import { Era } from "../game/types";
import styles from "./EraPill.module.css";

export function EraPill({ era }: { era: Era }) {
  return <span className={styles.pill}>{era}</span>;
}
```

- [ ] **Step 15: Run all tests**

Run: `npm test`
Expected: all prior tests still pass.

- [ ] **Step 16: Commit**

```bash
git add src/ui/
git commit -m "feat(ui): hints, guess tiles, color legend, era pill"
```

---

## Task 14: GuessInput

**Files:**
- Create: `src/ui/GuessInput.tsx`, `src/ui/GuessInput.module.css`, `src/ui/__tests__/GuessInput.test.tsx`

**Interfaces:**
- Consumes: `Era` from `../game/types.ts`; `eraRange` from `../game/eras.ts`.
- Produces: `GuessInput({ era, currentYear, disabled, onSubmit }: { era: Era; currentYear: number; disabled: boolean; onSubmit: (year: number) => void }): JSX.Element`. Numeric input bounded by the era's `[from, to)` for non-recent and `[from, currentYear]` for recent. On submit, calls `onSubmit(parsedYear)` only if the value is an integer in range; otherwise no-op (the form's native validation prevents submit). Clears the input after a successful submit.

- [ ] **Step 1: Write the failing test in `src/ui/__tests__/GuessInput.test.tsx`**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GuessInput } from "../GuessInput";

describe("GuessInput", () => {
  it("calls onSubmit with the parsed year", async () => {
    const onSubmit = vi.fn();
    render(<GuessInput era="modern" currentYear={2026} disabled={false} onSubmit={onSubmit} />);
    const input = screen.getByRole("spinbutton");
    await userEvent.type(input, "1571");
    await userEvent.click(screen.getByRole("button", { name: /guess/i }));
    expect(onSubmit).toHaveBeenCalledWith(1571);
  });

  it("displays the era range hint", () => {
    render(<GuessInput era="modern" currentYear={2026} disabled={false} onSubmit={() => {}} />);
    expect(screen.getByText(/1453.*1788/)).toBeInTheDocument();
  });

  it("disables the form when disabled", () => {
    render(<GuessInput era="modern" currentYear={2026} disabled={true} onSubmit={() => {}} />);
    expect(screen.getByRole("button", { name: /guess/i })).toBeDisabled();
    expect(screen.getByRole("spinbutton")).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- GuessInput`
Expected: FAIL with "Cannot find module '../GuessInput'".

- [ ] **Step 3: Write `src/ui/GuessInput.module.css`**

```css
.row { display: flex; gap: 8px; margin-top: 12px; }
.input {
  flex: 1;
  padding: 10px 14px;
  font-size: 18px;
  border: 1.5px solid #ccc;
  border-radius: 8px;
  text-align: center;
  font-family: inherit;
}
.btn {
  padding: 10px 20px;
  background: #2c3e50;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.hint { font-size: 12px; color: #888; margin-top: 8px; text-align: center; }
```

- [ ] **Step 4: Write `src/ui/GuessInput.tsx`**

```tsx
import { FormEvent, useState } from "react";
import { Era } from "../game/types";
import { eraRange } from "../game/eras";
import styles from "./GuessInput.module.css";

export function GuessInput({
  era,
  currentYear,
  disabled,
  onSubmit,
}: {
  era: Era;
  currentYear: number;
  disabled: boolean;
  onSubmit: (year: number) => void;
}) {
  const [value, setValue] = useState("");
  const { from, to } = eraRange(era, currentYear);
  const min = from;
  const max = to - 1;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) return;
    onSubmit(parsed);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.row}>
        <input
          className={styles.input}
          type="number"
          min={min}
          max={max}
          step={1}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`${min}–${max}`}
        />
        <button className={styles.btn} type="submit" disabled={disabled}>Guess</button>
      </div>
      <div className={styles.hint}>Enter a year between {min} and {max}</div>
    </form>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- GuessInput`
Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/ui/GuessInput.tsx src/ui/GuessInput.module.css src/ui/__tests__/GuessInput.test.tsx
git commit -m "feat(ui): bounded year input"
```

---

## Task 15: ShareButton + StatsModal

**Files:**
- Create: `src/ui/ShareButton.tsx`, `src/ui/ShareButton.module.css`, `src/ui/StatsModal.tsx`, `src/ui/StatsModal.module.css`, `src/ui/__tests__/ShareButton.test.tsx`

**Interfaces:**
- Consumes: `GameState`, `Stats` from `../game/types.ts`; `formatShare` from `../share/formatShare.ts`.
- Produces:
  - `ShareButton({ state, puzzleNumber, url }: { state: GameState; puzzleNumber: number; url: string }): JSX.Element` — button that copies `formatShare(state, puzzleNumber, url)` to the clipboard via `navigator.clipboard.writeText`. Shows "Share" by default, "Copied!" for 1.5s after a successful copy.
  - `StatsModal({ stats, gameState, onClose }: { stats: Stats; gameState: GameState; onClose: () => void }): JSX.Element` — overlay shown after game ends. Shows current streak, max streak, outcome ("You won in N/5" or "Game over — the answer was YYYY"), and renders the `ShareButton`.

- [ ] **Step 1: Write the failing test in `src/ui/__tests__/ShareButton.test.tsx`**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShareButton } from "../ShareButton";
import { GameState } from "../../game/types";

const state: GameState = {
  puzzle: { id: "lepanto-1571", era: "modern", answer: 1571, hints: ["a", "b", "c", "d", "e"] },
  guesses: [
    { year: 1500, distanceRatio: 0.21, bucket: "orange" },
    { year: 1571, distanceRatio: 0, bucket: "perfect" },
  ],
  outcome: "won",
  hintsRevealed: 2,
};

describe("ShareButton", () => {
  it("copies the share string to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<ShareButton state={state} puzzleNumber={42} url="https://example.com/daily-year/" />);
    await userEvent.click(screen.getByRole("button", { name: /share/i }));
    expect(writeText).toHaveBeenCalledWith(
      "Daily Year #42 — 2/5 🟧🟡\nplay at https://example.com/daily-year/",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ShareButton`
Expected: FAIL with "Cannot find module '../ShareButton'".

- [ ] **Step 3: Write `src/ui/ShareButton.module.css`**

```css
.btn {
  padding: 10px 20px;
  background: #2c3e50;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
```

- [ ] **Step 4: Write `src/ui/ShareButton.tsx`**

```tsx
import { useState } from "react";
import { GameState } from "../game/types";
import { formatShare } from "../share/formatShare";
import styles from "./ShareButton.module.css";

export function ShareButton({
  state,
  puzzleNumber,
  url,
}: {
  state: GameState;
  puzzleNumber: number;
  url: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    await navigator.clipboard.writeText(formatShare(state, puzzleNumber, url));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button className={styles.btn} type="button" onClick={handleClick}>
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
```

- [ ] **Step 5: Run ShareButton test to verify it passes**

Run: `npm test -- ShareButton`
Expected: 1 test passes.

- [ ] **Step 6: Write `src/ui/StatsModal.module.css`**

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.modal {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}
.title { font-size: 20px; font-weight: 600; margin: 0 0 12px; }
.outcome { font-size: 16px; margin: 0 0 16px; }
.statsRow { display: flex; gap: 24px; margin-bottom: 20px; }
.stat { flex: 1; text-align: center; }
.statValue { font-size: 28px; font-weight: 700; }
.statLabel { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
.actions { display: flex; gap: 8px; justify-content: flex-end; }
.close {
  padding: 10px 16px;
  background: transparent;
  border: 1px solid #ccc;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}
```

- [ ] **Step 7: Write `src/ui/StatsModal.tsx`**

```tsx
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
```

- [ ] **Step 8: Run all tests**

Run: `npm test`
Expected: all prior tests still pass.

- [ ] **Step 9: Commit**

```bash
git add src/ui/ShareButton.tsx src/ui/ShareButton.module.css src/ui/StatsModal.tsx src/ui/StatsModal.module.css src/ui/__tests__/ShareButton.test.tsx
git commit -m "feat(ui): share button and stats modal"
```

---

## Task 16: Board composition

**Files:**
- Create: `src/ui/Board.tsx`, `src/ui/Board.module.css`

**Interfaces:**
- Consumes: `GameState`, `Era` from `../game/types.ts`; subcomponents from `./Hints`, `./GuessTiles`, `./ColorLegend`, `./EraPill`, `./GuessInput`.
- Produces: `Board({ state, currentYear, onGuess }: { state: GameState; currentYear: number; onGuess: (year: number) => void }): JSX.Element` — composes header (title + era pill), hints, guess tiles, color legend, and guess input. Input is disabled when `state.outcome !== "playing"`.

- [ ] **Step 1: Write `src/ui/Board.module.css`**

```css
.frame {
  max-width: 520px;
  margin: 24px auto;
  background: #fafafa;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 24px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 12px;
  margin-bottom: 16px;
}
.title { font-weight: 600; font-size: 18px; }
.meta { color: #888; font-size: 13px; }
@media (max-width: 480px) {
  .frame { margin: 12px; padding: 16px; border-radius: 8px; }
}
```

- [ ] **Step 2: Write `src/ui/Board.tsx`**

```tsx
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
          <div className={styles.title}>Daily Year</div>
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
```

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: all prior tests still pass.

- [ ] **Step 4: Commit**

```bash
git add src/ui/Board.tsx src/ui/Board.module.css
git commit -m "feat(ui): board composition"
```

---

## Task 17: App wiring + integration test

**Files:**
- Modify: `src/App.tsx`, `src/App.module.css`
- Create: `src/App.module.css`, `src/__tests__/App.test.tsx`

**Interfaces:**
- Consumes: everything built so far.
- Produces: `App` component that:
  - On mount: reads `today()`, looks up puzzle via `selectPuzzle`, computes `puzzleNumberFor`, loads persisted state from `localStorage` (`window.localStorage`), seeds `useReducer` with `initialState(puzzle)` or restores `lastResult` if `lastPlayedDate === today`, renders `Board` with handlers.
  - On every reducer update: persists current state; on game end (`won` or `lost`), updates `stats` via `applyResult` and shows `StatsModal`.
  - When no puzzle for today: renders "No puzzle today, check back tomorrow." Centered, no board.

- [ ] **Step 1: Write the failing integration test in `src/__tests__/App.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";

beforeEach(() => {
  window.localStorage.clear();
  // Pin "today" to a date present in schedule.json
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-19T15:00:00Z"));
});

describe("App", () => {
  it("renders the board for today's puzzle", async () => {
    render(<App />);
    expect(await screen.findByText(/Daily Year/i)).toBeInTheDocument();
    expect(screen.getByText(/modern/i)).toBeInTheDocument();
    expect(screen.getByText(/Ottoman/i)).toBeInTheDocument();
  });

  it("reveals the next hint after a wrong guess", async () => {
    render(<App />);
    await screen.findByText(/Ottoman/i);
    const input = screen.getByRole("spinbutton");
    await userEvent.type(input, "1500");
    await userEvent.click(screen.getByRole("button", { name: /guess/i }));
    expect(screen.getByText(/Byzantine/i)).toBeInTheDocument();
    expect(screen.getByText("1500")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- App`
Expected: FAIL because `App` is still a placeholder.

- [ ] **Step 3: Write `src/App.module.css`**

```css
.empty {
  max-width: 520px;
  margin: 80px auto;
  padding: 32px;
  text-align: center;
  color: #555;
}
:global(body) {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background: #f5f5f5;
  color: #222;
}
```

- [ ] **Step 4: Rewrite `src/App.tsx`**

```tsx
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
```

- [ ] **Step 5: Run integration test to verify it passes**

Run: `npm test -- App`
Expected: 2 tests pass. If the test fails because `schedule.json` has no entry for `2026-06-19`, update `src/content/schedule.json` so it does.

- [ ] **Step 6: Run all tests + build**

Run: `npm test && npm run build`
Expected: all tests pass; build emits `dist/`.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/App.module.css src/__tests__/App.test.tsx
git commit -m "feat(app): wire reducer, persistence, modal"
```

---

## Task 18: GitHub Pages deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `.gitignore` (add `dist/`, `node_modules/`)

**Interfaces:**
- Consumes: working `npm run build`.
- Produces: A workflow that on push to `main`: checks out, installs deps, runs tests, builds, deploys `dist/` via `actions/deploy-pages`.

- [ ] **Step 1: Update `.gitignore`**

```
.superpowers/
node_modules/
dist/
```

- [ ] **Step 2: Write `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - id: deploy
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml .gitignore
git commit -m "ci: deploy to GitHub Pages on push to main"
```

- [ ] **Step 4: Push and verify deploy**

Run: `git push origin main` (after creating the GitHub repo and adding the remote). In the repo settings → Pages, set source to "GitHub Actions". Wait for the workflow to complete and confirm the deployed URL loads the game.

Expected: the deployed site shows today's puzzle (or the "no puzzle today" message if today is past the seeded schedule). Add more dates to `schedule.json` as needed.
