# Circa Range Answers + Era Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every puzzle's answer an inclusive year range `{from, to}`. Migrate existing exact-year puzzles to `from === to`. Update scoring to use distance-to-range. Localize the loss message to accept a pre-formatted string. Add build-time validation that the answer falls within the declared era.

**Architecture:** Type change → scoring change → answer-display helper → i18n signature tweak → StatsModal wiring → fixture cleanups → validation → docs. Each task is one cohesive commit.

**Tech Stack:** Same as base — React 18 + TS + Vite + Vitest.

## Global Constraints

- `YearRange = { from: number; to: number }`, with `from <= to` (inclusive both ends).
- `Puzzle.answer: YearRange`. Every existing single-year puzzle migrates to `{ from: N, to: N }`.
- Win condition: a guess `g` wins iff `g >= answer.from && g <= answer.to`. Tile is `perfect` (gold).
- Out-of-range distance: `d = min(|g - from|, |g - to|)`.
- `scoreGuess(guess, answer, era, currentYear)` — `answer` parameter is `YearRange`. Distance ratio + bucket logic otherwise unchanged.
- End-screen formats the answer via `formatAnswer({from, to})`: if `from === to` → `"1571"`, else `"1789–1799"` (en-dash U+2013).
- `STRINGS[locale].outcomeLoss` accepts a pre-formatted string (`a: string`), not a number.
- Share string unchanged: answer is not exposed.
- Validation: every puzzle's `answer.from <= answer.to` AND both bounds within `eraRange(puzzle.era, currentYearArt())`'s `[from, to)`.
- Hint and guess counts unchanged (5/5).
- Guess input bounds unchanged (era's `[from, to-1]`).

---

## Task 1: Type change + content migration

**Files:**
- Modify: `src/game/types.ts`, `src/content/puzzles.json`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `YearRange = { from: number; to: number }` exported from `types.ts`.
  - `Puzzle.answer: YearRange` (was `number`).
  - All puzzles in `puzzles.json` rewritten with `{ from: N, to: N }`.

After this task the test suite is RED — `scoring`, `reducer`, `formatShare`, `StatsModal`, App test fixtures all reference `answer` as a number. Subsequent tasks fix each consumer.

- [ ] **Step 1: Update `src/game/types.ts`**

Add the type and change `Puzzle.answer`. Leave other types untouched:

```ts
export type YearRange = { from: number; to: number };

export type Puzzle = {
  id: string;
  era: Era;
  answer: YearRange;
  hints: Record<Locale, [string, string, string, string, string]>;
};
```

- [ ] **Step 2: Rewrite `src/content/puzzles.json`**

Convert every `"answer": N` to `"answer": { "from": N, "to": N }`. Hints unchanged. Example:

```json
[
  {
    "id": "lepanto-1571",
    "era": "modern",
    "answer": { "from": 1571, "to": 1571 },
    "hints": { /* unchanged */ }
  },
  {
    "id": "moon-landing-1969",
    "era": "recent",
    "answer": { "from": 1969, "to": 1969 },
    "hints": { /* unchanged */ }
  },
  {
    "id": "magna-carta-1215",
    "era": "medieval",
    "answer": { "from": 1215, "to": 1215 },
    "hints": { /* unchanged */ }
  }
]
```

(Preserve the existing hint content verbatim — only the `answer` field changes.)

- [ ] **Step 3: Confirm suite is red as expected**

Run: `npm test`
Expected: TypeScript errors in scoring tests, reducer tests, and any other place that treats `puzzle.answer` as a number. That's the next tasks' work.

- [ ] **Step 4: Commit (suite red)**

```bash
git add src/game/types.ts src/content/puzzles.json
git commit -m "feat(content): YearRange answer shape + content migration; suite red until consumers updated"
```

---

## Task 2: Scoring uses distance-to-range

**Files:**
- Modify: `src/game/scoring.ts`, `src/game/__tests__/scoring.test.ts`, `src/game/__tests__/reducer.test.ts`, `src/game/__tests__/selectPuzzle.test.ts`

**Interfaces:**
- Consumes: `YearRange` from `types.ts`, `eraRange` from `eras.ts`.
- Produces:
  - `scoreGuess(guess: number, answer: YearRange, era: Era, currentYear: number): { distanceRatio, bucket }` — same return shape; `answer` is now a range.

- [ ] **Step 1: Rewrite `src/game/__tests__/scoring.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { scoreGuess } from "../scoring";

const exact = (year: number) => ({ from: year, to: year });

describe("scoreGuess (exact-year puzzles, from === to)", () => {
  it("returns perfect for an exact match", () => {
    expect(scoreGuess(1571, exact(1571), "modern", 2026)).toEqual({
      distanceRatio: 0,
      bucket: "perfect",
    });
  });

  it("computes distanceRatio as d/W in modern era", () => {
    const result = scoreGuess(1500, exact(1571), "modern", 2026);
    expect(result.distanceRatio).toBeCloseTo(71 / 336, 5);
  });

  it("caps distanceRatio at 1", () => {
    const result = scoreGuess(1453, exact(2026), "recent", 2026);
    expect(result.distanceRatio).toBe(1);
    expect(result.bucket).toBe("red");
  });

  it("returns green for d <= 0.01 * W", () => {
    expect(scoreGuess(1574, exact(1571), "modern", 2026).bucket).toBe("green");
  });

  it("returns lime / yellow / orange / red at their thresholds", () => {
    expect(scoreGuess(1582, exact(1571), "modern", 2026).bucket).toBe("lime");
    expect(scoreGuess(1600, exact(1571), "modern", 2026).bucket).toBe("yellow");
    expect(scoreGuess(1700, exact(1571), "modern", 2026).bucket).toBe("orange");
    expect(scoreGuess(1500, exact(1700), "modern", 2026).bucket).toBe("red");
  });

  it("handles BCE answers", () => {
    expect(scoreGuess(-1000, exact(-1000), "ancient", 2026)).toEqual({
      distanceRatio: 0,
      bucket: "perfect",
    });
  });

  it("computes distance correctly across BCE/CE boundary", () => {
    const result = scoreGuess(-10, exact(10), "ancient", 2026);
    expect(result.distanceRatio).toBeCloseTo(20 / 1229, 5);
  });
});

describe("scoreGuess (range puzzles, from < to)", () => {
  it("returns perfect for a guess at the lower bound", () => {
    expect(scoreGuess(1789, { from: 1789, to: 1799 }, "recent", 2026)).toEqual({
      distanceRatio: 0,
      bucket: "perfect",
    });
  });

  it("returns perfect for a guess at the upper bound", () => {
    expect(scoreGuess(1799, { from: 1789, to: 1799 }, "recent", 2026)).toEqual({
      distanceRatio: 0,
      bucket: "perfect",
    });
  });

  it("returns perfect for a guess inside the range", () => {
    expect(scoreGuess(1793, { from: 1789, to: 1799 }, "recent", 2026)).toEqual({
      distanceRatio: 0,
      bucket: "perfect",
    });
  });

  it("uses distance to nearest edge when guess is below the range", () => {
    const result = scoreGuess(1780, { from: 1789, to: 1799 }, "recent", 2026);
    expect(result.distanceRatio).toBeCloseTo(9 / 238, 5);
  });

  it("uses distance to nearest edge when guess is above the range", () => {
    const result = scoreGuess(1810, { from: 1789, to: 1799 }, "recent", 2026);
    expect(result.distanceRatio).toBeCloseTo(11 / 238, 5);
  });
});
```

- [ ] **Step 2: Run to verify failures**

Run: `npm test -- scoring`
Expected: all scoring tests FAIL (either TS error from old signature or wrong result).

- [ ] **Step 3: Update `src/game/scoring.ts`**

```ts
import { Bucket, Era, YearRange } from "./types";
import { eraRange } from "./eras";

const THRESHOLDS: { bucket: Bucket; max: number }[] = [
  { bucket: "perfect", max: 0 },
  { bucket: "green", max: 0.01 },
  { bucket: "lime", max: 0.05 },
  { bucket: "yellow", max: 0.15 },
  { bucket: "orange", max: 0.40 },
];

function distanceToRange(guess: number, answer: YearRange): number {
  if (guess >= answer.from && guess <= answer.to) return 0;
  return Math.min(Math.abs(guess - answer.from), Math.abs(guess - answer.to));
}

export function scoreGuess(
  guess: number,
  answer: YearRange,
  era: Era,
  currentYear: number,
): { distanceRatio: number; bucket: Bucket } {
  const { width } = eraRange(era, currentYear);
  const d = distanceToRange(guess, answer);
  const distanceRatio = Math.min(d / width, 1);

  if (d === 0) return { distanceRatio: 0, bucket: "perfect" };
  for (const { bucket, max } of THRESHOLDS) {
    if (bucket !== "perfect" && distanceRatio <= max) return { distanceRatio, bucket };
  }
  return { distanceRatio, bucket: "red" };
}
```

- [ ] **Step 4: Update `src/game/__tests__/reducer.test.ts`** — change the fixture's answer

Find every occurrence of `answer: 1571` (or any other bare number) in the reducer test fixtures and replace with `answer: { from: 1571, to: 1571 }`. Hints unchanged. Otherwise leave the tests untouched — reducer logic doesn't change.

- [ ] **Step 5: Update `src/game/__tests__/selectPuzzle.test.ts`** — same fixture migration

Find any fixture puzzle with `answer: <number>` and rewrite to `answer: { from: N, to: N }`. selectPuzzle logic doesn't touch the answer so no behavior change.

- [ ] **Step 6: Run to verify scoring + reducer + selectPuzzle all pass**

Run: `npm test -- scoring reducer selectPuzzle`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add src/game/
git commit -m "feat(game): scoring uses distance-to-range; reducer/selectPuzzle fixtures migrated"
```

---

## Task 3: formatAnswer helper

**Files:**
- Create: `src/ui/answer.ts`, `src/ui/__tests__/answer.test.ts`

**Interfaces:**
- Consumes: `YearRange` from `../game/types`.
- Produces: `formatAnswer(a: YearRange): string` — `"1571"` when `from === to`; `"1789–1799"` (en-dash) otherwise. Pure.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { formatAnswer } from "../answer";

describe("formatAnswer", () => {
  it("renders an exact-year answer as a single number", () => {
    expect(formatAnswer({ from: 1571, to: 1571 })).toBe("1571");
  });

  it("renders a range with an en-dash", () => {
    expect(formatAnswer({ from: 1789, to: 1799 })).toBe("1789–1799");
  });

  it("renders BCE exact-year as a single negative number", () => {
    expect(formatAnswer({ from: -1000, to: -1000 })).toBe("-1000");
  });

  it("renders a BCE-CE crossing range with an en-dash", () => {
    expect(formatAnswer({ from: -10, to: 10 })).toBe("-10–10");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- answer`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/ui/answer.ts`**

```ts
import { YearRange } from "../game/types";

export function formatAnswer(a: YearRange): string {
  return a.from === a.to ? String(a.from) : `${a.from}–${a.to}`;
}
```

- [ ] **Step 4: Run to verify passes**

Run: `npm test -- answer`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/ui/answer.ts src/ui/__tests__/answer.test.ts
git commit -m "feat(ui): formatAnswer helper for YearRange display"
```

---

## Task 4: i18n outcomeLoss signature change

**Files:**
- Modify: `src/i18n/strings.ts`, `src/i18n/__tests__/strings.test.ts`

**Interfaces:**
- `STRINGS[locale].outcomeLoss` signature changes from `(a: number) => string` to `(a: string) => string`. Callers will pass a pre-formatted string (via `formatAnswer`).

- [ ] **Step 1: Update `src/i18n/strings.ts`**

Change both locales' `outcomeLoss`:

```ts
// es:
outcomeLoss: (a: string) => `Se terminó — la respuesta era ${a}`,
// en:
outcomeLoss: (a: string) => `Game over — the answer was ${a}`,
```

(No template-literal change needed since the string interpolation already coerces. Only the parameter type changes.)

- [ ] **Step 2: Update `src/i18n/__tests__/strings.test.ts`**

Find the parameterized-strings test. Change `s.outcomeLoss(1571)` to `s.outcomeLoss("1571")` (and update the regex match to `/1571/` — still matches the same digit substring).

```ts
expect(s.outcomeLoss("1571")).toMatch(/1571/);
```

- [ ] **Step 3: Run to verify passes**

Run: `npm test -- strings`
Expected: 3 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/
git commit -m "feat(i18n): outcomeLoss takes a pre-formatted string"
```

---

## Task 5: StatsModal uses formatAnswer

**Files:**
- Modify: `src/ui/StatsModal.tsx`, `src/ui/__tests__/StatsModal.test.tsx`

**Interfaces:**
- Consumes: `formatAnswer` from `./answer.ts`.
- Produces: StatsModal loss outcome calls `s.outcomeLoss(formatAnswer(gameState.puzzle.answer))`.

- [ ] **Step 1: Update `src/ui/StatsModal.tsx`**

Add the import and change the outcome line. Find:

```tsx
? s.outcomeWin(gameState.guesses.length)
: s.outcomeLoss(gameState.puzzle.answer)
```

Change the loss branch to:

```tsx
: s.outcomeLoss(formatAnswer(gameState.puzzle.answer))
```

Add at the top of the file:

```ts
import { formatAnswer } from "./answer";
```

- [ ] **Step 2: Update `src/ui/__tests__/StatsModal.test.tsx`**

Find the fixture that currently sets `answer: 1571` (or similar bare number) and rewrite to `answer: { from: 1571, to: 1571 }`. The English loss test asserts `Game over — the answer was 1571` — that string still matches because `formatAnswer({from:1571,to:1571})` returns `"1571"`. No assertion text change needed.

Add one new test verifying a range answer is rendered with the en-dash:

```tsx
it("renders the en-dash for a range answer on loss", () => {
  const rangeState = {
    ...lostState,
    puzzle: { ...lostState.puzzle, answer: { from: 1789, to: 1799 } },
  };
  render(
    <StatsModal
      stats={stats}
      gameState={rangeState}
      puzzleNumber={42}
      url="https://example.com/circa/"
      locale="en"
      onClose={() => {}}
    />,
  );
  expect(screen.getByText(/the answer was 1789–1799/)).toBeInTheDocument();
});
```

- [ ] **Step 3: Run to verify passes**

Run: `npm test -- StatsModal`
Expected: all StatsModal tests pass (including the new range test).

- [ ] **Step 4: Commit**

```bash
git add src/ui/StatsModal.tsx src/ui/__tests__/StatsModal.test.tsx
git commit -m "feat(ui): StatsModal formats answer as range or single year"
```

---

## Task 6: Remaining fixture cleanups

**Files:**
- Modify: `src/share/__tests__/formatShare.test.ts`, `src/ui/__tests__/ShareButton.test.tsx`, `src/__tests__/App.test.tsx`

**Interfaces:** None — purely fixture migration. After this task the entire suite must be green.

- [ ] **Step 1: Update each test file's fixture answer**

In each file, find every puzzle fixture (typically near the top) with `answer: <number>` and rewrite to `answer: { from: N, to: N }`. Examples:

```ts
// formatShare.test.ts
puzzle: { id: "lepanto-1571", era: "modern", answer: { from: 1571, to: 1571 }, hints: { ... } },
```

Apply the same change in `ShareButton.test.tsx` and any fixture in `App.test.tsx`. Assertion text never includes the answer number directly (App test asserts hints; ShareButton asserts the share string which doesn't include the answer), so no other test updates should be needed.

- [ ] **Step 2: Run the whole suite to confirm green**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 3: Run build to confirm typecheck**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/share/__tests__/ src/ui/__tests__/ShareButton.test.tsx src/__tests__/App.test.tsx
git commit -m "test: migrate remaining fixtures to YearRange answer shape"
```

---

## Task 7: Era-containment validation

**Files:**
- Modify: `src/content/__tests__/puzzles.test.ts`

**Interfaces:**
- Consumes: `eraRange` from `src/game/eras.ts`; `currentYearArt` from `src/game/today.ts`.
- Produces: two new assertions per puzzle: well-ordered range, and both bounds within the era.

- [ ] **Step 1: Add the new tests**

Append to the existing `describe("puzzles.json", ...)` block:

```ts
import { eraRange } from "../../game/eras";
import { currentYearArt } from "../../game/today";

// (existing tests above)

it("every puzzle has answer.from <= answer.to", () => {
  for (const p of puzzles) {
    expect(p.answer.from, `${p.id} has from > to`).toBeLessThanOrEqual(p.answer.to);
  }
});

it("every puzzle's answer falls within its era", () => {
  const year = currentYearArt();
  for (const p of puzzles) {
    const { from, to } = eraRange(p.era, year);
    expect(p.answer.from, `${p.id} answer.from ${p.answer.from} outside era ${p.era} [${from}, ${to})`)
      .toBeGreaterThanOrEqual(from);
    expect(p.answer.from, `${p.id} answer.from ${p.answer.from} outside era ${p.era} [${from}, ${to})`)
      .toBeLessThan(to);
    expect(p.answer.to, `${p.id} answer.to ${p.answer.to} outside era ${p.era} [${from}, ${to})`)
      .toBeGreaterThanOrEqual(from);
    expect(p.answer.to, `${p.id} answer.to ${p.answer.to} outside era ${p.era} [${from}, ${to})`)
      .toBeLessThan(to);
  }
});
```

- [ ] **Step 2: Run to verify the new tests pass for the current 3 puzzles**

Run: `npm test -- puzzles`
Expected: 5 tests pass (3 existing + 2 new).

- [ ] **Step 3: Sanity check — temporarily break a puzzle and confirm the test catches it**

Edit `src/content/puzzles.json`, change `lepanto-1571`'s era from `"modern"` to `"medieval"`. Run `npm test -- puzzles`. Expected: era-containment test fails with a clear message naming the puzzle. Revert the change.

(This sanity check is not committed — it's a manual verification of the validator.)

- [ ] **Step 4: Commit**

```bash
git add src/content/__tests__/puzzles.test.ts
git commit -m "test(content): validate answer range falls within declared era"
```

---

## Task 8: CLAUDE.md update

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update the "Authoring a new puzzle" section**

Find the JSON snippet in the "Authoring a new puzzle" section. Replace the `answer` line:

```json
"answer": 1571,
```

with:

```json
"answer": { "from": 1571, "to": 1571 },
```

Below the snippet's bullet list, add two bullets:

> - `answer` is `{ from, to }` (inclusive both ends). Exact-year puzzles use `from === to`. Range puzzles (e.g. an event that spans multiple years) use distinct values.
> - Both `from` and `to` must fall within the era's range — `src/content/__tests__/puzzles.test.ts` enforces this.

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document YearRange answer shape and era validation"
```
