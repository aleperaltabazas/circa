# Win/Lose Fanfare — Design Spec

**Date:** 2026-06-25

## Goal

Make the end-of-game modal more expressive: a bold headline when the player wins ("You got it!") with a confetti burst, and a clear message when they lose ("You ran out of attempts"). The guess count is preserved as secondary text on wins; the answer is preserved as secondary text on losses.

## Architecture

No new components needed. Changes touch:

- `src/i18n/strings.ts` — new string keys for headline vs. sub-text
- `src/ui/StatsModal.tsx` — restructured outcome section, confetti trigger
- `src/ui/StatsModal.module.css` — styles for headline and sub-text
- `package.json` / `package-lock.json` — add `canvas-confetti` dependency

## New i18n Keys

Replace the existing `outcomeWin(g)` and `outcomeLoss(a)` with:

| Key | en | es |
|-----|----|----|
| `outcomeWinHeadline` | `"You got it!"` | `"¡Lo lograste!"` |
| `outcomeWinSub(g)` | `` `in ${g}/5` `` | `` `en ${g}/5` `` |
| `outcomeLossHeadline` | `"You ran out of attempts"` | `"Te quedaste sin intentos"` |
| `outcomeLossSub(a)` | `` `The answer was ${a}` `` | `` `La respuesta era ${a}` `` |

The old `outcomeWin` / `outcomeLoss` keys are removed; `StatsModal` is the only consumer.

## StatsModal Changes

The outcome section becomes:

```
<p className={styles.outcomeHeadline}>{headline}</p>
<p className={styles.outcomeSub}>{sub}</p>
```

Where `headline` and `sub` are derived from `gameState.outcome` + new string keys.

A `useEffect` in `StatsModal` fires `confetti({ ... })` once on mount, guarded by `gameState.outcome === "won"`. No cleanup needed — `canvas-confetti` manages its own canvas element and removes it after the animation completes.

Confetti call:
```ts
confetti({ particleCount: 120, spread: 80, origin: { y: 0.3 } });
```

## CSS

```css
.outcomeHeadline { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
.outcomeSub      { font-size: 14px; color: #555; margin: 0 0 16px; }
```

The existing `.outcome` class is removed.

## Error Handling

`canvas-confetti` is a cosmetic enhancement. If it throws (e.g. canvas blocked by a browser policy), the modal still functions normally — no try/catch needed beyond what the library handles internally.

## Testing

- Existing `App.test.tsx` snapshot/integration tests should continue to pass unchanged (they don't assert on modal text keys currently).
- Manual verification: win a game → confetti fires, headline reads correctly in both locales; lose a game → no confetti, loss headline and answer shown correctly.
