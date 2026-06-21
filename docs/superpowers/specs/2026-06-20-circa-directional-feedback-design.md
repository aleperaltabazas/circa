# Circa — Directional Feedback

**Date:** 2026-06-20
**Status:** Approved for implementation
**Builds on:** [2026-06-19-daily-year-design.md](./2026-06-19-daily-year-design.md), [2026-06-20-circa-i18n-design.md](./2026-06-20-circa-i18n-design.md), [2026-06-20-circa-range-answers-design.md](./2026-06-20-circa-range-answers-design.md)

## Summary

Each guess tile now shows a directional arrow indicating whether the answer is earlier or later than the guess. The continuous color gradient stays — direction is additive, not replacement. Color tells you "how close"; arrow tells you "which way." A guess in the answer range shows no arrow (it's already gold/perfect).

## Motivation

Two guesses that fall in the same color bucket are perceptually indistinguishable — the gradient theoretically carries the information ("darker green is closer") but human eyes can't reliably read sub-bucket hue differences. Adding direction lets the player bracket the answer between guesses regardless of color sensitivity.

## Direction logic

```ts
export type Direction = "earlier" | "later" | "match";

function directionOf(guess: number, answer: YearRange): Direction {
  if (guess >= answer.from && guess <= answer.to) return "match";
  return guess < answer.from ? "later" : "earlier";
}
```

- `"later"` — the answer is later than the guess (guess was too early). Arrow points up: ▲ (aim higher).
- `"earlier"` — the answer is earlier than the guess (guess was too late). Arrow points down: ▼ (aim lower).
- `"match"` — guess is in `[from, to]`. No arrow rendered (the tile is already gold).

### Range-answer semantics

- Guess inside `[from, to]` → `"match"`, no arrow.
- Guess below `from` → `"later"` (need to go later to reach the range).
- Guess above `to` → `"earlier"` (need to go earlier to reach the range).

Direction is always well-defined for non-matching guesses regardless of whether the answer is an exact year or a range.

## Scoring change

`scoreGuess` returns an additional field:

```ts
function scoreGuess(
  guess: number,
  answer: YearRange,
  era: Era,
  currentYear: number,
): {
  distanceRatio: number;
  bucket: Bucket;
  direction: Direction;
}
```

All existing fields and behavior preserved. `direction` is computed via the new `directionOf` helper.

## Data shape change

`Guess` in `src/game/types.ts` gains `direction`:

```ts
export type Guess = {
  year: number;
  bucket: Bucket;
  distanceRatio: number;
  direction: Direction;
};
```

`reducer.ts` doesn't change — it already spreads the full `scoreGuess` result into the new guess record.

## UI: arrow rendering on `GuessTiles`

Each filled tile renders:
- The year (centered, current behavior).
- A small arrow glyph indicating direction:
  - `direction === "later"` → ▲
  - `direction === "earlier"` → ▼
  - `direction === "match"` → no arrow (the perfect/gold tile speaks for itself).

Layout decision: the arrow sits as a small superscript-style glyph in the top-right corner of the tile so it doesn't crowd the year. CSS-level tuning is implementation detail.

For accessibility, each filled tile gets an `aria-label` like `"1480, too early"` / `"1500, too late"` / `"1490, exact"`, localized via the i18n bundle. Sighted users see the arrow; screen-reader users hear the textual description.

## i18n additions

`STRINGS[locale]` gains two keys:

```ts
// es:
directionLabel: { earlier: "muy tarde", later: "muy temprano", match: "exacto" },
guessAria: (year: number, dirLabel: string) => `${year}, ${dirLabel}`,

// en:
directionLabel: { earlier: "too late", later: "too early", match: "exact" },
guessAria: (year: number, dirLabel: string) => `${year}, ${dirLabel}`,
```

The arrow glyph itself is language-independent. The `aria-label` is constructed from `guessAria(year, directionLabel[direction])`.

## Storage migration

`Guess` shape gains `direction`, so `lastResult.guesses[*]` has a new field. Decision: **drop v2 state, do not migrate**.

- Bump `schemaVersion` from `2` to `3`.
- `load()`: v2 stored data → return `EMPTY` (start fresh, keep `locale` from EMPTY which is `DEFAULT_LOCALE`).
- No reverse-engineering of `direction` from old guesses.

The cost is one day of in-flight progress for a tiny user base. The benefit is no migration code.

## Share string

Unchanged. Direction is in-game only. The shareable line stays brand-stable and the emoji row remains bucket-based — Wordle convention is that the share string shows magnitude (color) but not direction.

## What does NOT change

- Color bucket logic and continuous gradient (still calibrated by era width).
- Number of hints / guesses (5 / 5).
- Win / loss conditions.
- `formatShare`.
- Hints, LocaleToggle, Board layout, GuessInput, StatsModal — except where listed above.

## Files touched

| File | Change |
|---|---|
| `src/game/types.ts` | Add `Direction` type; `Guess` gains `direction: Direction` |
| `src/game/scoring.ts` | New private `directionOf` (or inline); `scoreGuess` returns `direction` |
| `src/game/__tests__/scoring.test.ts` | Update existing tests to assert direction; add direction-specific cases (exact match, in-range match, below range, above range, exact year above/below) |
| `src/game/__tests__/reducer.test.ts` | Update assertions of guess shape to include `direction` |
| `src/i18n/strings.ts` | Add `directionLabel` object and `guessAria` function for both locales |
| `src/i18n/__tests__/strings.test.ts` | Assert new keys exist with parallel structure |
| `src/ui/GuessTiles.tsx` | Render arrow glyph per direction + aria-label per tile |
| `src/ui/GuessTiles.module.css` | Style for arrow positioning |
| `src/ui/__tests__/GuessTiles.test.tsx` | Update existing tests to include `direction` in fixtures; new tests asserting arrow rendering + aria-label per direction in both locales |
| `src/storage/localStorage.ts` | Bump `schemaVersion` to `3`; v2 → EMPTY on load; drop v1→v2 migration code (v1 already gone two schemas back) |
| `src/storage/__tests__/localStorage.test.ts` | Update version assertions to 3; v2 stored data → EMPTY |
| `src/share/__tests__/formatShare.test.ts` | Update fixture guess records to include `direction` |
| `src/ui/__tests__/ShareButton.test.tsx` | Update fixture guess records to include `direction` |
| `src/ui/__tests__/StatsModal.test.tsx` | Update fixture guess records to include `direction` |
| `CLAUDE.md` | Document the directional signal under "Key conventions" |

## Out of scope

- Direction in the share string.
- Comparative ("warmer/colder than last") arrows.
- Direction styling beyond a simple glyph (no animations, no color of its own).
- Configurable arrow style (▲▼ are fixed).
- Direction localization beyond aria-labels (the glyph is universal).
