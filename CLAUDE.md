# Circa

A daily browser game: guess the year of a historic event from 5 progressively revealed hints. Wordle-style 5/5 guesses, color-graded distance feedback. Static SPA, deploys to GitHub Pages.

## Stack

React 18 + TypeScript + Vite + Vitest + @testing-library/react. No state library beyond `useReducer`. No component library — CSS modules + custom properties. Node 20+.

## Commands

- `npm run dev` — Vite dev server
- `npm test` — run all tests once
- `npm run test:watch` — watch mode
- `npm run build` — typecheck + production build to `dist/`
- `npm run author` — interactive wizard to create a new puzzle

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
    ShareButton.tsx, StatsModal.tsx, TriviaBox.tsx, DateChip.tsx
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
- **Color buckets.** Tiles and share emojis share a single 4-bucket palette: `perfect` (✅, deep emerald), `close` (🟩, green), `mid` (🟨, yellow), `far` (🟥, red). Bucket thresholds are: perfect d==0; close d ≤ 0.05·W; mid d ≤ 0.25·W; far otherwise. The perfect tile gets a CSS shimmer + corner ✨ glyphs to make a win unmistakable.
- **Closeness hint pill.** Below each filled guess tile, a small text pill conveys closeness. First guess (or same distance as previous): absolute label `muy lejos / cerca / muy cerca`. Subsequent: trend `más cerca / te alejaste`. When within 3% of era width: `¡por poco!` overrides everything. No pill on a perfect guess.
- **Direction is shown per tile.** Each filled `GuessTile` renders a ▲ (answer is later) or ▼ (answer is earlier); a perfect/match guess shows no arrow. Direction is computed by `scoreGuess` and stored on each `Guess`. The arrow glyph is language-independent; the tile's `aria-label` is localized.
- **Date-anchored puzzles.** A puzzle whose event happened on the same calendar date as its scheduled date gets `dateAnchored: true`. A `DateChip` then renders next to the era pill, showing the localized day+short-month. Without the flag, the chip is absent. The chip is metadata only — it does not change scoring or hints.
- **localStorage is schema-versioned.** Bump `schemaVersion` in `src/storage/localStorage.ts` when the persisted shape changes. Add a migration when old data can be safely upgraded forward; return `EMPTY` when it cannot (acceptable for tiny user base / in-flight games).

## Authoring a new puzzle

### Preferred path: the wizard

Run `npm run author` and follow the prompts. The wizard validates each field as you go (era ↔ answer year, id uniqueness, locale completeness, date uniqueness), pops `$EDITOR` for the two description paragraphs, and writes both JSON files. It runs the content-validation test suite as a final sanity check and stages the files via `git add`. You then `git diff --staged` and commit when you're happy.

### Manual path (fallback)

1. Add an entry to `src/content/puzzles.json`:
   ```json
   {
     "id": "kebab-case-id-YYYY",
     "era": "modern",
     "answer": { "from": 1571, "to": 1571 },
     "hints": {
      "es": ["pista vaga 1", "...", "...", "...", "ancla específica 5"]
     },
     "description": {
      "es": "Un párrafo de trivia sobre el evento, en español."
     }
   }
   ```
   - Hints go vague → specific.
   - `description` is one short paragraph (2-5 sentences) per locale, shown after the game ends. Required for every locale.
   - Must have exactly 5 hints for the `es` locale. A Vitest validation test (`src/content/__tests__/puzzles.test.ts`) enforces this.
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
