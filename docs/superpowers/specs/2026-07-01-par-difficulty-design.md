# Par Difficulty — Design

**Date:** 2026-07-01

## Summary

Add a `par` field (1–5) to every puzzle indicating the expected hint number at which a typical player would solve it. Par 1 = solvable from hint 1 (easy); par 5 = needs all 5 hints (hard). Shown as a static badge in the board's top-right corner throughout the game. Not included in the share string.

Inspired by Bandle's par display.

## Data Model

Add `par: 1 | 2 | 3 | 4 | 5` as a **required** field on the `Puzzle` type in `src/game/types.ts`.

```ts
export type Par = 1 | 2 | 3 | 4 | 5;

export type Puzzle = {
  id: string;
  era: Era;
  answer: Answer;
  par: Par;
  hints: Record<Locale, [string, string, string, string, string]>;
  description: Record<Locale, string>;
  dateAnchored?: boolean;
};
```

All 5 existing puzzles in `src/content/puzzles.json5` get `par: 3` as a placeholder; the author will update them individually later.

## Content Validation

`src/content/__tests__/puzzles.test.ts` gains a new test:

```
every puzzle has par in [1, 5]
```

Asserts `typeof p.par === "number"`, `p.par >= 1`, `p.par <= 5`, and that it is an integer.

## Display — ParBadge Component

New files: `src/ui/ParBadge.tsx` + `src/ui/ParBadge.module.css`.

Renders a small pill: `Par N`. Always visible — before, during, and after the game. No interaction, no tooltip.

Visual style: neutral muted outline pill (not colored like the bucket system). Similar in shape to the era pill but without a colored dot.

Placement: inside `Board.tsx`'s `headerRight` div, alongside the `LocaleToggle`. The two sit side-by-side in the top-right of the header.

```tsx
<div className={styles.headerRight}>
  <ParBadge par={state.puzzle.par} />
  <LocaleToggle locale={locale} onChange={onLocaleChange} />
</div>
```

## Author Wizard

`scripts/new-puzzle.ts` gets a new `input` prompt between the description step and the schedule date step:

```
Par (1–5) — expected hint number to solve:
```

Validates: integer, value in [1, 5]. Stored as `par` on the new puzzle object.

A matching validator `validatePar(v: number): string | null` is added to `scripts/authoring/validators.ts`.

## i18n

No i18n changes needed. "Par" is universally understood and used as-is.

## Out of Scope

- Par does not affect scoring, color buckets, or closeness hints.
- Par is not included in the share string.
- Par is not shown in the stats/result modal.
- No per-player "did you beat par?" mechanic.
