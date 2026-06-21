# Circa Directional Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a directional arrow to each filled guess tile indicating whether the answer is earlier (▼) or later (▲) than the guess. Keep all existing color and distance behavior. Provide localized aria-labels.

**Architecture:** Extend `scoreGuess` to also return `direction`; thread that through `Guess` → `GuessTiles`. Bump localStorage schema (drop v2 state). Add i18n entries for direction text. Update existing fixtures across tests.

**Tech Stack:** Same as base.

## Global Constraints

- `Direction = "earlier" | "later" | "match"`.
- `directionOf(guess, answer)`: returns `"match"` if guess in `[answer.from, answer.to]`; `"later"` if guess < from; `"earlier"` if guess > to.
- `scoreGuess` adds `direction: Direction` to its return.
- `Guess` type gains `direction: Direction`.
- UI: `"later"` → ▲, `"earlier"` → ▼, `"match"` → no arrow. Each filled tile has a localized `aria-label` of the form `"{year}, {directionLabel}"`.
- i18n: `STRINGS[locale].directionLabel.{earlier|later|match}` plus `guessAria(year, dirLabel)`. ES: `muy tarde / muy temprano / exacto`. EN: `too late / too early / exact`.
- Schema bumps to `3`. v2 stored data is dropped (load → EMPTY). No new migration code; v1→v2 code path is removed.
- Share string unchanged. Color buckets and gradient unchanged. Reducer logic unchanged.

---

## Task 1: Direction type + scoring

**Files:**
- Modify: `src/game/types.ts`, `src/game/scoring.ts`, `src/game/__tests__/scoring.test.ts`

**Interfaces:**
- Consumes: `YearRange`, `Era`, `Bucket` from `types.ts`.
- Produces:
  - `Direction = "earlier" | "later" | "match"` exported from `types.ts`.
  - `Guess.direction: Direction` added to the `Guess` type.
  - `scoreGuess(guess, answer, era, currentYear): { distanceRatio: number; bucket: Bucket; direction: Direction }`.

- [ ] **Step 1: Extend `src/game/__tests__/scoring.test.ts`**

Append a new `describe` block at the end for direction. Also update an existing assertion at the top of each existing test to include `direction`. The minimal approach is to add `direction: <expected>` to each existing `toEqual({...})` assertion that currently checks `{ distanceRatio, bucket }`. Specifically:

- Exact-match test (`scoreGuess(1571, exact(1571), ...)`) — direction `"match"`.
- BCE exact-match — direction `"match"`.
- Range tests at lower bound / upper bound / interior — direction `"match"`.
- The rest of the existing tests use `toBeCloseTo` or only assert `bucket`; leave those untouched.

Then add a new block:

```ts
describe("scoreGuess direction", () => {
  const exact = (year: number) => ({ from: year, to: year });

  it("returns match for an exact-year hit", () => {
    expect(scoreGuess(1571, exact(1571), "modern", 2026).direction).toBe("match");
  });

  it("returns later when guess is before an exact answer", () => {
    expect(scoreGuess(1500, exact(1571), "modern", 2026).direction).toBe("later");
  });

  it("returns earlier when guess is after an exact answer", () => {
    expect(scoreGuess(1600, exact(1571), "modern", 2026).direction).toBe("earlier");
  });

  it("returns match for any guess inside a range answer", () => {
    expect(scoreGuess(1793, { from: 1789, to: 1799 }, "recent", 2026).direction).toBe("match");
    expect(scoreGuess(1789, { from: 1789, to: 1799 }, "recent", 2026).direction).toBe("match");
    expect(scoreGuess(1799, { from: 1789, to: 1799 }, "recent", 2026).direction).toBe("match");
  });

  it("returns later when guess is below a range answer", () => {
    expect(scoreGuess(1780, { from: 1789, to: 1799 }, "recent", 2026).direction).toBe("later");
  });

  it("returns earlier when guess is above a range answer", () => {
    expect(scoreGuess(1810, { from: 1789, to: 1799 }, "recent", 2026).direction).toBe("earlier");
  });

  it("handles BCE direction correctly", () => {
    expect(scoreGuess(-2000, exact(-1000), "ancient", 2026).direction).toBe("later");
    expect(scoreGuess(0, exact(-1000), "ancient", 2026).direction).toBe("earlier");
  });
});
```

- [ ] **Step 2: Run to verify failures**

Run: `npm test -- scoring`
Expected: new direction tests FAIL ("direction is not a property") and existing tests using `toEqual` may also fail (missing `direction` key in actual vs expected). That's the next steps' work.

- [ ] **Step 3: Update `src/game/types.ts`**

Add `Direction` type and extend `Guess`:

```ts
export type Direction = "earlier" | "later" | "match";

export type Guess = {
  year: number;
  bucket: Bucket;
  distanceRatio: number;
  direction: Direction;
};
```

(Leave other types unchanged.)

- [ ] **Step 4: Update `src/game/scoring.ts`**

```ts
import { Bucket, Direction, Era, YearRange } from "./types";
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

function directionOf(guess: number, answer: YearRange): Direction {
  if (guess >= answer.from && guess <= answer.to) return "match";
  return guess < answer.from ? "later" : "earlier";
}

export function scoreGuess(
  guess: number,
  answer: YearRange,
  era: Era,
  currentYear: number,
): { distanceRatio: number; bucket: Bucket; direction: Direction } {
  const { width } = eraRange(era, currentYear);
  const d = distanceToRange(guess, answer);
  const distanceRatio = Math.min(d / width, 1);
  const direction = directionOf(guess, answer);

  if (d === 0) return { distanceRatio: 0, bucket: "perfect", direction };
  for (const { bucket, max } of THRESHOLDS) {
    if (bucket !== "perfect" && distanceRatio <= max) return { distanceRatio, bucket, direction };
  }
  return { distanceRatio, bucket: "red", direction };
}
```

- [ ] **Step 5: Run to verify scoring tests pass**

Run: `npm test -- scoring`
Expected: all scoring tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/game/types.ts src/game/scoring.ts src/game/__tests__/scoring.test.ts
git commit -m "feat(game): scoring returns direction"
```

---

## Task 2: Reducer fixture updates

**Files:**
- Modify: `src/game/__tests__/reducer.test.ts`

**Interfaces:** None — pure fixture migration. `reducer.ts` doesn't change because it spreads the full `scoreGuess` result.

- [ ] **Step 1: Update reducer test fixture expectations**

In `src/game/__tests__/reducer.test.ts`, any assertion that checks the shape of a guess object (e.g. `expect(next.guesses[0]).toEqual({...})` or property checks) now needs `direction`. Most tests in this file likely only assert specific fields (`bucket`, `year`) — those don't need updating. Find assertions that check guess shape exhaustively (e.g. via `toEqual`) and add the `direction` field, or change them to `toMatchObject` for forward-compatibility.

Concretely: scan for `bucket:` in test assertions. For each `toEqual({ year, bucket, distanceRatio })`-style check, add `direction: <expected>`. The "appends a wrong guess" test checks `next.guesses[0].year` and `next.guesses[0].bucket` separately, not as a whole object — no change needed. Verify by running tests after a no-op edit.

- [ ] **Step 2: Run reducer tests**

Run: `npm test -- reducer`
Expected: all pass. If any fail because of missing `direction` in expected shape, add it.

- [ ] **Step 3: Commit (if changes were needed; otherwise skip commit and go to Task 3)**

```bash
git add src/game/__tests__/reducer.test.ts
git commit -m "test(reducer): include direction in guess shape assertions"
```

(If no fixture change was required, no commit. Note in the report that no edits were needed.)

---

## Task 3: i18n directionLabel + guessAria

**Files:**
- Modify: `src/i18n/strings.ts`, `src/i18n/__tests__/strings.test.ts`

**Interfaces:**
- `STRINGS[locale].directionLabel = { earlier, later, match }` — strings.
- `STRINGS[locale].guessAria = (year: number, dirLabel: string) => string`.

- [ ] **Step 1: Extend strings test**

Add to `src/i18n/__tests__/strings.test.ts`:

```ts
it("has directionLabel for every direction in every locale", () => {
  const refDirs = Object.keys(STRINGS[LOCALES[0]].directionLabel).sort();
  expect(refDirs).toEqual(["earlier", "later", "match"]);
  for (const loc of LOCALES) {
    expect(Object.keys(STRINGS[loc].directionLabel).sort()).toEqual(refDirs);
  }
});

it("guessAria interpolates both year and direction label", () => {
  for (const loc of LOCALES) {
    const s = STRINGS[loc];
    const aria = s.guessAria(1571, s.directionLabel.earlier);
    expect(aria).toMatch(/1571/);
    expect(aria).toMatch(new RegExp(s.directionLabel.earlier));
  }
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- strings`
Expected: new tests FAIL — `directionLabel` undefined.

- [ ] **Step 3: Update `src/i18n/strings.ts`**

Add the new keys to both locales' bundles:

```ts
// es:
directionLabel: { earlier: "muy tarde", later: "muy temprano", match: "exacto" },
guessAria: (year: number, dirLabel: string) => `${year}, ${dirLabel}`,
// en:
directionLabel: { earlier: "too late", later: "too early", match: "exact" },
guessAria: (year: number, dirLabel: string) => `${year}, ${dirLabel}`,
```

Place these inside each bundle alongside the other keys. Keep alphabetical or logical grouping consistent with existing entries.

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- strings`
Expected: all strings tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/
git commit -m "feat(i18n): directionLabel + guessAria for both locales"
```

---

## Task 4: GuessTiles renders arrows and aria-labels

**Files:**
- Modify: `src/ui/GuessTiles.tsx`, `src/ui/GuessTiles.module.css`, `src/ui/__tests__/GuessTiles.test.tsx`

**Interfaces:**
- `GuessTiles({ guesses, locale })` — new `locale: Locale` prop so it can build aria-labels.
- Each filled tile renders the year, an arrow glyph per `direction`, and an `aria-label`.

- [ ] **Step 1: Update GuessTiles tests**

Rewrite `src/ui/__tests__/GuessTiles.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GuessTiles } from "../GuessTiles";

describe("GuessTiles", () => {
  it("renders 5 tiles, filling submitted guesses and leaving the rest empty", () => {
    render(
      <GuessTiles
        locale="es"
        guesses={[
          { year: 1500, distanceRatio: 0.21, bucket: "orange", direction: "later" },
          { year: 1600, distanceRatio: 0.08, bucket: "yellow", direction: "earlier" },
        ]}
      />,
    );
    expect(screen.getByText("1500")).toBeInTheDocument();
    expect(screen.getByText("1600")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(3);
  });

  it("applies an inline background color to a filled tile", () => {
    const { container } = render(
      <GuessTiles
        locale="es"
        guesses={[{ year: 1571, distanceRatio: 0, bucket: "perfect", direction: "match" }]}
      />,
    );
    const filled = container.querySelector("[data-filled='true']") as HTMLElement;
    expect(filled.style.background).toBeTruthy();
  });

  it("renders an up arrow when direction is later", () => {
    render(
      <GuessTiles
        locale="en"
        guesses={[{ year: 1500, distanceRatio: 0.21, bucket: "orange", direction: "later" }]}
      />,
    );
    expect(screen.getByText("▲")).toBeInTheDocument();
  });

  it("renders a down arrow when direction is earlier", () => {
    render(
      <GuessTiles
        locale="en"
        guesses={[{ year: 1700, distanceRatio: 0.38, bucket: "orange", direction: "earlier" }]}
      />,
    );
    expect(screen.getByText("▼")).toBeInTheDocument();
  });

  it("renders no arrow when direction is match", () => {
    render(
      <GuessTiles
        locale="en"
        guesses={[{ year: 1571, distanceRatio: 0, bucket: "perfect", direction: "match" }]}
      />,
    );
    expect(screen.queryByText("▲")).not.toBeInTheDocument();
    expect(screen.queryByText("▼")).not.toBeInTheDocument();
  });

  it("sets a localized aria-label per filled tile (Spanish)", () => {
    render(
      <GuessTiles
        locale="es"
        guesses={[{ year: 1500, distanceRatio: 0.21, bucket: "orange", direction: "later" }]}
      />,
    );
    expect(screen.getByLabelText("1500, muy temprano")).toBeInTheDocument();
  });

  it("sets a localized aria-label per filled tile (English)", () => {
    render(
      <GuessTiles
        locale="en"
        guesses={[{ year: 1700, distanceRatio: 0.38, bucket: "orange", direction: "earlier" }]}
      />,
    );
    expect(screen.getByLabelText("1700, too late")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failures**

Run: `npm test -- GuessTiles`
Expected: new tests FAIL because GuessTiles doesn't accept `locale` and doesn't render arrows.

- [ ] **Step 3: Update `src/ui/GuessTiles.tsx`**

```tsx
import { Direction, Guess } from "../game/types";
import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import { colorFor } from "./color";
import styles from "./GuessTiles.module.css";

const ARROW: Record<Direction, string | null> = {
  later: "▲",
  earlier: "▼",
  match: null,
};

export function GuessTiles({ guesses, locale }: { guesses: Guess[]; locale: Locale }) {
  const s = STRINGS[locale];
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
            aria-label={s.guessAria(g.year, s.directionLabel[g.direction])}
          >
            <span className={styles.year}>{g.year}</span>
            {ARROW[g.direction] && (
              <span className={styles.arrow} aria-hidden="true">{ARROW[g.direction]}</span>
            )}
          </div>
        ) : (
          <div key={i} className={`${styles.tile} ${styles.empty}`}>—</div>
        ),
      )}
    </div>
  );
}
```

- [ ] **Step 4: Update `src/ui/GuessTiles.module.css`**

Add positioning for the arrow. Current tile rules stay. Append:

```css
.tile { position: relative; }
.year {
  /* year remains centered; no change to its visual style */
}
.arrow {
  position: absolute;
  top: 2px;
  right: 6px;
  font-size: 11px;
  line-height: 1;
  opacity: 0.85;
}
```

If `.tile { position: relative; }` is already present, don't duplicate; just add `.year` and `.arrow` and any missing positioning.

- [ ] **Step 5: Run to verify pass**

Run: `npm test -- GuessTiles`
Expected: all GuessTiles tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/ui/GuessTiles.tsx src/ui/GuessTiles.module.css src/ui/__tests__/GuessTiles.test.tsx
git commit -m "feat(ui): GuessTiles renders direction arrow + aria-label"
```

---

## Task 5: Thread locale into Board → GuessTiles

**Files:**
- Modify: `src/ui/Board.tsx`

**Interfaces:** `Board` already receives `locale` (added in i18n feature); pass it down to `GuessTiles`.

- [ ] **Step 1: Update `src/ui/Board.tsx`**

Find the `<GuessTiles guesses={state.guesses} />` line and change to `<GuessTiles guesses={state.guesses} locale={locale} />`.

No other changes.

- [ ] **Step 2: Run full suite**

Run: `npm test`
Expected: all tests pass (except possibly fixture issues in App, formatShare, ShareButton, StatsModal which Task 7 cleans up).

- [ ] **Step 3: Commit**

```bash
git add src/ui/Board.tsx
git commit -m "feat(ui): Board passes locale to GuessTiles"
```

---

## Task 6: Storage schema bump v2 → v3

**Files:**
- Modify: `src/storage/localStorage.ts`, `src/storage/__tests__/localStorage.test.ts`

**Interfaces:**
- `PersistedShape.schemaVersion: 3`.
- `EMPTY.schemaVersion === 3`.
- `load()`: v2 (and any other non-v3) returns EMPTY. Remove the v1 → v2 migration branch — schema is now two versions removed.

- [ ] **Step 1: Update storage tests**

Edit `src/storage/__tests__/localStorage.test.ts`. Replace the existing v1 migration test and the schema-version assertions:

- Update the EMPTY test to expect `schemaVersion: 3`.
- Replace the v1-migration test with: "returns EMPTY when stored schemaVersion is 2 (no migration)":

```ts
it("EMPTY has DEFAULT_LOCALE and schemaVersion 3", () => {
  expect(EMPTY.locale).toBe("es");
  expect(EMPTY.schemaVersion).toBe(3);
});

it("returns EMPTY when stored schemaVersion is 2", () => {
  storage.setItem("circa", JSON.stringify({ schemaVersion: 2, locale: "en" }));
  expect(load(storage)).toEqual(EMPTY);
});

it("returns EMPTY for unknown schema versions", () => {
  storage.setItem("circa", JSON.stringify({ schemaVersion: 999 }));
  expect(load(storage)).toEqual(EMPTY);
});
```

Round-trip test (existing): update to set/read v3 data. The round-trip object should include `schemaVersion: 3` and a `locale` field (use existing test's structure).

- [ ] **Step 2: Run to verify failures**

Run: `npm test -- localStorage`
Expected: FAIL because EMPTY.schemaVersion is currently 2.

- [ ] **Step 3: Update `src/storage/localStorage.ts`**

```ts
import { GameState, Stats } from "../game/types";
import { Locale, DEFAULT_LOCALE } from "../i18n/types";

const KEY = "circa";

export type PersistedShape = {
  schemaVersion: 3;
  lastPlayedDate: string | null;
  lastResult: GameState | null;
  stats: Stats;
  locale: Locale;
};

export const EMPTY: PersistedShape = {
  schemaVersion: 3,
  lastPlayedDate: null,
  lastResult: null,
  stats: { currentStreak: 0, maxStreak: 0, lastWinDate: null },
  locale: DEFAULT_LOCALE,
};

export function load(storage: Storage): PersistedShape {
  const raw = storage.getItem(KEY);
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.schemaVersion !== 3) return EMPTY;
    return parsed as PersistedShape;
  } catch {
    return EMPTY;
  }
}

export function save(storage: Storage, data: PersistedShape): void {
  storage.setItem(KEY, JSON.stringify(data));
}
```

Note the v1→v2 migration branch is removed; only v3 is accepted, everything else returns EMPTY.

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- localStorage`
Expected: all storage tests pass.

- [ ] **Step 5: Check App.tsx for hardcoded schemaVersion**

`App.tsx` writes `{ ...persisted, schemaVersion: 2, ... }` in its persistence effect. Update that literal to `3`.

```bash
grep -n "schemaVersion" src/App.tsx
```

If found, change `2` to `3`. (No commit yet — bundle with Step 6.)

- [ ] **Step 6: Run full suite**

Run: `npm test`
Expected: all tests pass except possibly fixtures in formatShare/ShareButton/StatsModal/App which Task 7 cleans up.

- [ ] **Step 7: Commit**

```bash
git add src/storage/ src/App.tsx
git commit -m "feat(storage): bump schema to v3; drop v2 state on load"
```

---

## Task 7: Fixture cleanups across remaining tests

**Files:**
- Modify: `src/share/__tests__/formatShare.test.ts`, `src/ui/__tests__/ShareButton.test.tsx`, `src/ui/__tests__/StatsModal.test.tsx`, `src/__tests__/App.test.tsx` (if needed)

**Interfaces:** None — fixture-only updates. After this task the entire suite must be green.

- [ ] **Step 1: Add `direction` to every guess fixture**

For every guess object in any test file that constructs a `Guess` literal, add `direction: <value>`:

- `direction: "later"` if the year is before the answer
- `direction: "earlier"` if the year is after
- `direction: "match"` if exact

Search:

```bash
grep -rln "bucket:" src/__tests__/ src/share/__tests__/ src/ui/__tests__/
```

Inspect each match and add the `direction` field to keep TypeScript happy. (The shape might not always be type-checked depending on inference, but adding it everywhere is safe.)

- [ ] **Step 2: Run full suite**

Run: `npm test`
Expected: all 90+ tests pass.

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add src/share/__tests__/ src/ui/__tests__/ src/__tests__/
git commit -m "test: include direction in guess fixtures"
```

---

## Task 8: CLAUDE.md update

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add a bullet to the "Key conventions" section**

Find the existing bullet about color:

> - **Color = continuous + discrete.** Tiles use a continuous HSL hue lerp (green 120° → red 0°, ratio = distance/era-width). Discrete buckets exist only for the share-string emojis.

Add immediately after it:

> - **Direction is shown per tile.** Each filled `GuessTile` renders a ▲ (answer is later) or ▼ (answer is earlier); a perfect/match guess shows no arrow. Direction is computed by `scoreGuess` and stored on each `Guess`. The arrow glyph is language-independent; the tile's `aria-label` is localized.

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document directional feedback signal"
```
