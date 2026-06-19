# Daily Year — Design Spec

**Date:** 2026-06-19
**Status:** Draft for implementation

## Summary

A daily browser game where the player guesses the year of a historic event. Each puzzle gives 5 freeform hints and the player has 5 guesses. After each wrong guess, the next hint is revealed and the guess is color-graded by how far off it is. State persists client-side; deployed as a static site on GitHub Pages.

Inspired by Wordle (5/5 guesses, color feedback, daily rotation, share string) and Framed (single-puzzle-per-day with revealed clues).

## Scope (v1)

In scope:
- One puzzle per day, selected by date in `America/Argentina/Buenos_Aires` time.
- 5 hints revealed progressively after wrong guesses.
- 5 total guesses per puzzle. Win = exact year. Loss = 5 wrong guesses.
- Color-coded distance feedback per guess (no directional info).
- Per-puzzle `era` enum that defines the valid guess range and calibrates the color gradient.
- localStorage persistence: today's game state, streak, max streak.
- Wordle-style share string.
- Static deployment to GitHub Pages.

Out of scope (v1):
- Accounts, server-side persistence, leaderboards.
- Archive of past puzzles.
- Multiple difficulty modes.
- BCE/CE input toggle on UI (BCE years are valid inputs only when the puzzle's era spans pre-CE).

## Game mechanics

### Puzzle structure

Each puzzle is JSON:

```json
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
}
```

- `id`: stable string identifier (used by the schedule and for the share string).
- `era`: one of `prehistory | ancient | medieval | modern | recent`.
- `answer`: integer. Negative for BCE.
- `hints`: array of exactly 5 strings, ordered from vaguest (hint 1) to most specific (hint 5). Hint content is freeform — no enforced angle structure.

### Era ranges

| era | from | to |
|---|---|---|
| prehistory | -3000 | -753 |
| ancient | -753 | 476 |
| medieval | 476 | 1453 |
| modern | 1453 | 1789 |
| recent | 1789 | current calendar year in ART (inclusive) |

`from`/`to` are inclusive on `from`, exclusive on `to`, except `recent.to` which is inclusive of the current year. This means a year on a boundary (e.g. 476) belongs to the later era (medieval). The era of a puzzle constrains the guess input to that range and calibrates the color gradient (see below).

### Turn loop

1. Game starts with hint 1 visible. Guess input enabled, bounded to the puzzle's era range.
2. Player submits a guess (integer in range).
3. If guess === answer → win. Game ends; show full answer and stats.
4. Else: record the guess + its color bucket, reveal the next hint, allow another guess. After 5 total guesses → loss. Game ends; show full answer.

### Color feedback

Distance `d = abs(guess - answer)`. Era width `W = era.to - era.from`.

`scoring.ts` returns two values for each guess:

1. **`distanceRatio`** — a continuous `number` in `[0, 1]`, where `0` = exact and `1` = at or beyond era width. Formula: `min(d / W, 1)`. The tile color is computed at render time by linearly interpolating HSL hue between green (120°) at ratio 0 and red (0°) at ratio 1, with fixed saturation/lightness. A perfect guess (ratio 0) renders as gold instead of green.
2. **`bucket`** — a discrete enum used only for the share string emoji row, since emojis are discrete. Buckets are evaluated in order — first match wins:

| bucket | condition | share emoji |
|---|---|---|
| perfect | d == 0 | 🟡 |
| green | d ≤ W × 0.01 | 🟢 |
| lime | d ≤ W × 0.05 | 🟩 |
| yellow | d ≤ W × 0.15 | 🟨 |
| orange | d ≤ W × 0.40 | 🟧 |
| red | otherwise | 🟥 |

Bucket thresholds may be tuned during playtesting; the table above is the v1 starting point. The continuous color is independent of these thresholds.

### Daily rotation

- "Today" is computed as the calendar date in `America/Argentina/Buenos_Aires` via `Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" })`, which yields `YYYY-MM-DD`.
- Puzzle selection: look up today's date in `schedule.json`. If absent → "no puzzle today" screen.
- The puzzle rolls over at midnight ART regardless of player location.

### Share string

After a finished game (win or loss):

```
Daily Year #N — G/5 ⬛🟧🟨🟩
play at <url>
```

- `N` is a sequential puzzle number: the 1-based index of today's date in the chronologically-sorted keys of `schedule.json`.
- `G/5` is guesses used; on loss this shows `X/5`.
- The emoji row is one square per guess, using the bucket → emoji mapping in the Color feedback section above.
- URL is read at runtime from `window.location.origin + window.location.pathname`. `formatShare` is pure — it takes the URL as a parameter; the call site reads `window.location`.

### localStorage shape

```json
{
  "schemaVersion": 1,
  "lastPlayedDate": "2026-06-19",
  "lastResult": {
    "puzzleId": "lepanto-1571",
    "guesses": [{ "year": 1500, "bucket": "orange" }, { "year": 1571, "bucket": "perfect" }],
    "outcome": "won"
  },
  "stats": {
    "currentStreak": 4,
    "maxStreak": 11,
    "lastWinDate": "2026-06-19"
  }
}
```

Streak rules (evaluated when a game finishes):
- On win: if `lastWinDate` is yesterday (ART), `currentStreak += 1`. Otherwise `currentStreak = 1`. Then `lastWinDate = today`.
- On loss: `currentStreak = 0`. `lastWinDate` unchanged.
- `maxStreak = max(maxStreak, currentStreak)` after any update.

A skipped day is never observed directly; the gap is detected on the next win by the `lastWinDate !== yesterday` check.

## Architecture

Static single-page app. All game logic and content client-side. Content (puzzles + schedule) shipped as JSON in the bundle, fetched at startup.

### File layout

```
src/
  main.tsx                  # entry, mounts <App/>
  App.tsx                   # screen state: loading | playing | done | no-puzzle | error
  game/
    types.ts                # Puzzle, Era, Bucket, Guess, GameState
    eras.ts                 # Era → { from, to, label } table
    scoring.ts              # (guess, answer, era) → Bucket. Pure.
    selectPuzzle.ts         # (today, schedule, puzzles) → Puzzle | null. Pure.
    reducer.ts              # (state, action) → state. Pure.
  storage/
    localStorage.ts         # load/save, schema versioning, safe parse boundary
  share/
    formatShare.ts          # (GameState, puzzleNumber, url) → string. Pure.
  ui/
    Board.tsx               # hint reveal + guess history
    GuessInput.tsx          # numeric input bounded by era range
    ColorBar.tsx            # gradient legend
    ShareButton.tsx
    StatsModal.tsx
  content/
    puzzles.json            # array of Puzzle
    schedule.json           # { "YYYY-MM-DD": puzzle_id }
public/
  index.html
```

### Module responsibilities

- **`scoring.ts`** — single pure function mapping `(guess, answer, era)` to `{ distanceRatio, bucket }`. Era width drives both. Testable in isolation.
- **`selectPuzzle.ts`** — pure function from `(today, schedule, puzzles)` to the day's puzzle or `null`.
- **`reducer.ts`** — pure state machine. Actions: `submitGuess(year)`, `restoreFromStorage(state)`. No I/O.
- **`localStorage.ts`** — only file allowed to touch `localStorage`. Wraps parse/stringify with schema-version check; on mismatch or corrupt JSON, drops state and returns the empty state. Migrations live here.
- **`formatShare.ts`** — pure. Takes the URL as a parameter (caller reads `window.location`). No clipboard side effects (those live in `ShareButton.tsx`).

UI components are presentational and accept state + dispatch as props. The reducer is owned by `App.tsx`.

### Error handling boundaries

- `localStorage.ts` — corrupt JSON or schema mismatch → return empty state, do not crash.
- `selectPuzzle.ts` — date not in schedule → returns `null`, UI shows "no puzzle today, check back tomorrow."
- Puzzle/schedule JSON fetch failure at startup → one retry, then an "unable to load today's puzzle" error screen.

No other defensive code. Internal calls between modules trust their inputs (types enforced by TypeScript).

## Testing

- Vitest unit tests for every pure module: `scoring`, `selectPuzzle`, `reducer`, `formatShare`, `localStorage` load/save round-trips.
- One Testing Library integration test for the play loop: render `App`, submit a wrong guess, verify a hint is revealed and the guess shows its bucket color.
- No end-to-end / browser-driven tests in v1.

## Deployment

- Build with `vite build` → `dist/`.
- GitHub Actions workflow on push to `main`: install, test, build, deploy to `gh-pages` branch via `actions/deploy-pages`.
- Vite `base` set to the repo path (e.g. `/daily-year/`).
- `puzzles.json` and `schedule.json` live in the repo and are part of the bundle — authoring a new puzzle is a code change + commit.

## Tech stack

- React 18 + TypeScript
- Vite (build + dev server)
- Vitest + @testing-library/react (tests)
- No state library beyond `useReducer`
- No component library. CSS modules + CSS custom properties for theming. The UI is ~6 components; MUI and similar are net-negative at this size.
- Mobile-first responsive layout via plain media queries. Target: a single column centered with `max-width: 520px`; readable down to ~320px wide.

## Future work (post v1)

- Color threshold tuning after playtesting.
- Archive mode (play past days' puzzles).
- BCE input affordances (sign toggle vs. negative number).
- Dark/light theme toggle.
