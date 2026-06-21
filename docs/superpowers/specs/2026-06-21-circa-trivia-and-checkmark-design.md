# Circa — Trivia Box + Perfect ✅

**Date:** 2026-06-21
**Status:** Approved for implementation
**Builds on:** prior Circa specs (i18n, range-answers, directional-feedback)

## Summary

Two changes bundled:
1. Replace the "perfect" share emoji 🟡 with ✅ — clearer win signal.
2. After a game ends, render a persistent trivia box below the board with a one-paragraph description of the historic event and a share button. The modal still appears the first time a game finishes in a session, but does not reappear on reload of an already-finished puzzle.

## Change 1: ✅ for perfect bucket

In `src/share/formatShare.ts`, the `EMOJI` map's `perfect` entry changes from `"🟡"` to `"✅"`. All other entries unchanged. Update `formatShare.test.ts` assertions accordingly (four assertions reference `🟡`).

Discrete bucket → emoji is the only place this matters. Tile color (gold) for the in-game perfect indicator is unchanged.

## Change 2: trivia box

### Data shape

`Puzzle` gains a required per-locale `description` field:

```ts
type Puzzle = {
  id: string;
  era: Era;
  answer: YearRange;
  hints: Record<Locale, [string, string, string, string, string]>;
  description: Record<Locale, string>;
};
```

One paragraph of trivia per locale. Each existing puzzle in `puzzles.json` is rewritten to include this field.

### Validation

`src/content/__tests__/puzzles.test.ts` extends: every puzzle has a non-empty string `description[locale]` for every locale in `LOCALES`. Mirrors the existing hint-completeness pattern.

### Component: TriviaBox

`src/ui/TriviaBox.tsx`:

```tsx
TriviaBox({
  puzzle,
  gameState,
  puzzleNumber,
  url,
  locale,
}: {
  puzzle: Puzzle;
  gameState: GameState;
  puzzleNumber: number;
  url: string;
  locale: Locale;
}): JSX.Element
```

Renders inside a card matching the Board's visual style (`max-width: 520px`, centered, same border-radius / padding / background). Contents:
- A title row: `STRINGS[locale].triviaTitle` ("Sobre este puzzle" / "About this puzzle") on the left, the formatted answer (`formatAnswer(puzzle.answer)`) on the right as a small label.
- The localized `puzzle.description[locale]` paragraph.
- The existing `<ShareButton>` (same component, same share-string contents — locale passed through).

The box is purely presentational; no internal state.

### App wiring

Two changes in `src/App.tsx`:

1. **Render `<TriviaBox>` below `<Board>`** whenever `state.outcome !== "playing"`. Always visible in the finished state — independent of modal open/close.

2. **Modal does not auto-open on reload of a finished game.** The existing `useEffect` already computes `previouslyFinished`. Use that signal:
   - If `state.outcome !== "playing"` AND `previouslyFinished` (the player already finished this puzzle before this mount), `modalOpen` initial state is `false`.
   - Otherwise (fresh state OR the reducer transitions to finished during this session), the modal opens as today.

   The trivia box and modal coexist for the celebratory first finish; on reload, only the trivia box is visible.

### i18n additions

`STRINGS[locale]` gains one new key:

```ts
// es
triviaTitle: "Sobre este puzzle",
// en
triviaTitle: "About this puzzle",
```

### Files touched

| File | Change |
|---|---|
| `src/share/formatShare.ts` | `EMOJI.perfect = "✅"` |
| `src/share/__tests__/formatShare.test.ts` | `🟡` → `✅` in expected strings |
| `src/game/types.ts` | `Puzzle.description: Record<Locale, string>` |
| `src/content/puzzles.json` | Add `description` to every puzzle |
| `src/content/__tests__/puzzles.test.ts` | Validate description present + non-empty for every locale |
| `src/i18n/strings.ts` | Add `triviaTitle` key for es + en |
| `src/i18n/__tests__/strings.test.ts` | Assert new key present in both locales |
| `src/ui/TriviaBox.tsx` (+ css) | New component |
| `src/ui/__tests__/TriviaBox.test.tsx` | Render tests in both locales |
| `src/App.tsx` | Mount TriviaBox below Board when finished; modal opens only on first finish this session |
| `src/__tests__/App.test.tsx` | New test: reload of finished game shows TriviaBox without auto-opening modal |
| `CLAUDE.md` | Document description field + TriviaBox + modal-open rule under conventions |

## Out of scope

- Different share content from the modal's ShareButton.
- Showing trivia before the game ends.
- Animations on TriviaBox appearance.
- TriviaBox in locales beyond es + en (it follows the Locale enum).
- Hiding the TriviaBox once shown (it stays for the rest of the session; reload reshows it).
- A separate "tap to hide" affordance.
