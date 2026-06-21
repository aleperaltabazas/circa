# Circa

A daily browser game: guess the year of a historic event from 5 progressively revealed hints. Wordle-style 5/5 guesses, color-graded distance feedback. Static SPA, deploys to GitHub Pages.

## Stack

React 18 + TypeScript + Vite + Vitest + @testing-library/react. No state library beyond `useReducer`. No component library — CSS modules + custom properties. Node 20+.

## Commands

- `npm run dev` — Vite dev server
- `npm test` — run all tests once
- `npm run test:watch` — watch mode
- `npm run build` — typecheck + production build to `dist/`

## Project layout

```
src/
  App.tsx                # top-level wiring: today() → puzzle, reducer, persistence, modal
  game/                  # pure game logic — no I/O, no window/Date access except today.ts
    types.ts             # Puzzle, Era, Bucket, Guess, GameState, Stats
    eras.ts              # era → {from, to, width}
    scoring.ts           # (guess, answer, era, currentYear) → {distanceRatio, bucket}
    selectPuzzle.ts      # (todayIso, schedule, puzzles) → Puzzle | null
    puzzleNumber.ts      # 1-based index of today in chronologically-sorted schedule
    reducer.ts           # game state machine; ignores actions once outcome !== "playing"
    streak.ts            # applyResult(stats, "won"|"lost", todayIso)
    today.ts             # ART-timezone boundary; only file allowed to read new Date()
  storage/
    localStorage.ts      # only file allowed to touch localStorage; schema-versioned
  share/
    formatShare.ts       # Wordle-style share string; pure (URL passed in)
  ui/
    color.ts             # Guess → CSS hsl() color (continuous gradient)
    Board.tsx            # composes Hints + GuessTiles + ColorLegend + EraPill + GuessInput
    Hints.tsx, GuessTiles.tsx, GuessInput.tsx, ColorLegend.tsx, EraPill.tsx
    ShareButton.tsx, StatsModal.tsx
    *.module.css         # per-component
  content/
    puzzles.json         # all puzzles, by id
    schedule.json        # { "YYYY-MM-DD": puzzle_id }
```

Tests live in `__tests__/` folders next to their subject.

## Key conventions

- **Pure modules stay pure.** `scoring`, `selectPuzzle`, `reducer`, `streak`, `formatShare`, `puzzleNumber`, `color` — none of them read `Date.now()`, `window`, `localStorage`, or `fetch`. Time / URL / storage are passed in. `today.ts` is the only sanctioned exception (Intl wrapper).
- **Timezone is `America/Argentina/Buenos_Aires`.** Always derive "today" via `today()` from `src/game/today.ts`. Never `new Date().toISOString().slice(0,10)`.
- **Era ranges are bounded.** Each puzzle's `era` enum (`prehistory|ancient|medieval|modern|recent`) defines the valid input range AND calibrates the color gradient width. See `eras.ts` for the table.
- **Color = continuous + discrete.** Tiles use a continuous HSL hue lerp (green 120° → red 0°, ratio = distance/era-width). Discrete buckets exist only for the share-string emojis.
- **Direction is shown per tile.** Each filled `GuessTile` renders a ▲ (answer is later) or ▼ (answer is earlier); a perfect/match guess shows no arrow. Direction is computed by `scoreGuess` and stored on each `Guess`. The arrow glyph is language-independent; the tile's `aria-label` is localized.
- **localStorage is schema-versioned.** Bump `schemaVersion` and add a migration in `src/storage/localStorage.ts` when the persisted shape changes.

## Authoring a new puzzle

1. Add an entry to `src/content/puzzles.json`:
   ```json
   {
     "id": "kebab-case-id-YYYY",
     "era": "modern",
     "answer": { "from": 1571, "to": 1571 },
     "hints": {
      "es": ["pista vaga 1", "...", "...", "...", "ancla específica 5"],
      "en": ["vague hint 1", "...", "...", "...", "specific anchor hint 5"]
    }
   }
   ```
   - Hints go vague → specific.
   - Must have exactly 5 hints for every locale in `src/i18n/types.ts` (`es` and `en`). A Vitest validation test (`src/content/__tests__/puzzles.test.ts`) enforces this.
   - `answer` is `{ from, to }` (inclusive both ends). Exact-year puzzles use `from === to`. Range puzzles (e.g. an event that spans multiple years) use distinct values.
   - Both `from` and `to` must fall within the era's range — `src/content/__tests__/puzzles.test.ts` enforces this.
   - `era` must match where `answer` falls (see `eras.ts` table).
2. Add a row to `src/content/schedule.json` mapping a future ART date to the new id:
   ```json
   "2026-06-22": "kebab-case-id-YYYY"
   ```
3. The puzzle number (`#N` in the share string) is the 1-based index of the date in chronologically-sorted schedule keys — adding earlier dates renumbers later ones, so prefer appending.

## Deployment

Push to `main` triggers `.github/workflows/deploy.yml`: tests → build → upload `dist/` → deploy via `actions/deploy-pages`. Repo settings → Pages must be set to "GitHub Actions".

Vite `base` is `/circa/` (set in `vite.config.ts`). If the GitHub Pages URL path changes, update it there.

## Spec and plan

The original design and implementation plan live in `docs/superpowers/`. Treat them as historical context — the code is the source of truth now.
