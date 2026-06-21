# Circa — Range Answers + Era Validation

**Date:** 2026-06-20
**Status:** Approved for implementation
**Builds on:** [2026-06-19-daily-year-design.md](./2026-06-19-daily-year-design.md), [2026-06-20-circa-i18n-design.md](./2026-06-20-circa-i18n-design.md)

## Summary

Replace the single-year puzzle answer with an inclusive year range `{ from, to }`. Exact-year puzzles use `from === to`; range puzzles use distinct values. Any guess within `[from, to]` wins. Distance scoring uses distance to the nearest edge of the range. Add build-time validation that each puzzle's answer falls within its declared era.

## Motivation

- Some historical events naturally span a multi-year period (a war, a reign, a movement) and an exact single year would be unfair or arbitrary.
- A real bug: a puzzle was authored with `answer: 1853, era: "modern"` but `modern` is `[1453, 1789)`. Build-time validation catches this class of mistake.

## Puzzle data shape

```ts
type YearRange = { from: number; to: number };

type Puzzle = {
  id: string;
  era: Era;
  answer: YearRange;  // inclusive on both ends; from <= to
  hints: Record<Locale, [string, string, string, string, string]>;
};
```

All existing puzzles migrate from `answer: 1571` to `answer: { from: 1571, to: 1571 }`. After migration there is one code path everywhere — no branching on number vs object.

## Game mechanics

### Win condition

A guess `g` wins iff `g >= answer.from && g <= answer.to`. The tile renders as `perfect` (gold).

### Distance scoring

```ts
function distanceToRange(g: number, a: YearRange): number {
  if (g >= a.from && g <= a.to) return 0;
  return Math.min(Math.abs(g - a.from), Math.abs(g - a.to));
}
```

`scoreGuess` becomes:

```ts
function scoreGuess(
  guess: number,
  answer: YearRange,
  era: Era,
  currentYear: number,
): { distanceRatio: number; bucket: Bucket } {
  const { width } = eraRange(era, currentYear);
  const d = distanceToRange(guess, answer);
  const distanceRatio = Math.min(d / width, 1);
  if (d === 0) return { distanceRatio: 0, bucket: "perfect" };
  // ... existing bucket-threshold loop unchanged
}
```

Era width still drives the gradient calibration; the bucket thresholds are unchanged. The change is local: the only difference is `d` is now distance-to-range instead of `|guess - answer|`.

### Guess input

Still bounded to the era's `[from, to-1]`. Unchanged.

### Number of hints and guesses

Still 5 / 5. Unchanged regardless of whether the puzzle is exact or range.

## End-screen / share

### Answer display

A small pure helper:

```ts
function formatAnswer(a: YearRange): string {
  return a.from === a.to ? String(a.from) : `${a.from}–${a.to}`;
}
```

The en-dash is `–` (U+2013), not a hyphen.

`STRINGS[locale].outcomeLoss` already takes a formatted argument — its signature changes from `(a: number) => string` to `(a: string) => string`. Spanish stays `Se terminó — la respuesta era ${a}`, English stays `Game over — the answer was ${a}`. `StatsModal` calls `s.outcomeLoss(formatAnswer(gameState.puzzle.answer))`.

### Share string

No change. Still `Circa #N — G/5 emojis\nshareTail`. The answer is not exposed in the share string.

## Validation

Extend `src/content/__tests__/puzzles.test.ts` with two new assertions per puzzle:

1. **Well-ordered range:** `answer.from <= answer.to`.
2. **Era containment:** both `answer.from` and `answer.to` fall within `eraRange(puzzle.era, currentYearArt()).from` (inclusive) and `eraRange(...).to` (exclusive). Use `currentYearArt()` from `src/game/today.ts` so the `recent` era's upper bound stays accurate over calendar time.

A puzzle with `era: "modern", answer: { from: 1853, to: 1853 }` fails the second assertion because `1853 >= 1789`.

## State and component impact

| File | Change |
|---|---|
| `src/game/types.ts` | Add `YearRange = { from: number; to: number }`; `Puzzle.answer` becomes `YearRange` |
| `src/game/scoring.ts` | New private `distanceToRange`; `scoreGuess` signature accepts `YearRange` |
| `src/game/__tests__/scoring.test.ts` | Update existing assertions to use range shape; add in-range + nearest-edge tests |
| `src/game/reducer.ts` | No logic change. `scoreGuess` call already passes `state.puzzle.answer` |
| `src/game/__tests__/reducer.test.ts` | Update fixture answer to `{ from, to }` |
| `src/ui/answer.ts` (new) | `formatAnswer(a: YearRange): string` |
| `src/ui/__tests__/answer.test.ts` (new) | Tests for exact, range, BCE-CE crossing |
| `src/ui/StatsModal.tsx` | Pass `formatAnswer(gameState.puzzle.answer)` to `s.outcomeLoss` |
| `src/ui/__tests__/StatsModal.test.tsx` | Update loss test to use range fixture; assert formatted answer |
| `src/i18n/strings.ts` | `outcomeLoss(a: number)` → `outcomeLoss(a: string)` in both locales |
| `src/i18n/__tests__/strings.test.ts` | Update `outcomeLoss` parameterized assertion to pass a string |
| `src/share/formatShare.ts` | No change |
| `src/share/__tests__/formatShare.test.ts` | Update fixture answer shape (no behavior change) |
| `src/__tests__/App.test.tsx` | No change required; if any fixture uses raw `answer`, update shape |
| `src/content/puzzles.json` | Migrate all existing puzzles to range form |
| `src/content/__tests__/puzzles.test.ts` | Add well-ordered + era-containment assertions |
| `CLAUDE.md` | Update puzzle-authoring section: `answer` is now `{ from, to }`; document that exact-year is `from === to`; document the era-containment validation |

## Out of scope

- Variable hints/guesses for range puzzles.
- A UI hint telling players "this puzzle is a range answer" — invisible until the end.
- Distance scoring that rewards being inside the range more than just being close — any in-range guess is `perfect`.
- Sharing the answer (or range) in the share string.
- Allowing era's themselves to be parameterized per puzzle.
