# Circa Trivia Box + Perfect ✅ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the perfect-share emoji 🟡 with ✅, and add a persistent post-game trivia box (per-locale event description + share button) that appears below the board whenever the game has ended. Modal auto-opens only on the first finish in a session.

**Architecture:** Add `description` per-locale to `Puzzle`; new `TriviaBox` component; modify `App.tsx` to mount it below Board when finished and to gate the modal's auto-open on a "previously finished" check.

**Tech Stack:** Same as base.

## Global Constraints

- `EMOJI.perfect = "✅"` in `src/share/formatShare.ts`. All other emojis unchanged.
- `Puzzle.description: Record<Locale, string>` — required for every locale, validated at build time.
- `TriviaBox({ puzzle, gameState, puzzleNumber, url, locale })` — pure presentational; renders title + formatted answer + description + ShareButton.
- TriviaBox visual style matches Board (same max-width, padding, border, background).
- App.tsx: TriviaBox renders whenever `state.outcome !== "playing"`. Modal `modalOpen` initial state is `false` when the game was already finished before this mount; `true` only when the game transitions to finished during this session.
- New i18n key `triviaTitle`: es `"Sobre este puzzle"`, en `"About this puzzle"`.

---

## Task 1: Perfect ✅ emoji change

**Files:**
- Modify: `src/share/formatShare.ts`, `src/share/__tests__/formatShare.test.ts`

**Interfaces:** None — single map entry change + four expected-string updates in tests.

- [ ] **Step 1: Update test expectations**

In `src/share/__tests__/formatShare.test.ts`, find every `🟡` in expected strings and change to `✅`. There are four `toBe(...)` calls (win/loss × es/en). Example:

```ts
expect(formatShare(baseWin, 42, "https://example.com/circa/", "es")).toBe(
  "Circa #42 — 3/5 🟧🟨✅\njugá en https://example.com/circa/",
);
```

(The win fixtures end with a `perfect` guess; the loss fixtures don't include `perfect`. So only the two win-case assertions change.)

- [ ] **Step 2: Run to verify failures**

Run: `npm test -- formatShare`
Expected: 2 tests FAIL (win cases) because formatShare still emits 🟡.

- [ ] **Step 3: Update `src/share/formatShare.ts`**

Change the `EMOJI` map's `perfect` entry from `"🟡"` to `"✅"`. Leave the other entries (green, lime, yellow, orange, red) untouched.

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- formatShare`
Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/share/
git commit -m "feat(share): use ✅ for perfect bucket emoji"
```

---

## Task 2: Puzzle description field + content

**Files:**
- Modify: `src/game/types.ts`, `src/content/puzzles.json`, `src/content/__tests__/puzzles.test.ts`

**Interfaces:**
- Consumes: `Locale`, `LOCALES`.
- Produces: `Puzzle.description: Record<Locale, string>`. Every puzzle in puzzles.json has a description for every locale. Validation test catches missing/empty descriptions.

- [ ] **Step 1: Update `src/game/types.ts`**

Extend the `Puzzle` type:

```ts
export type Puzzle = {
  id: string;
  era: Era;
  answer: YearRange;
  hints: Record<Locale, [string, string, string, string, string]>;
  description: Record<Locale, string>;
};
```

(Other types unchanged.)

- [ ] **Step 2: Add the validation test**

Append to the existing `describe("puzzles.json", ...)` block in `src/content/__tests__/puzzles.test.ts`:

```ts
it("every puzzle has a non-empty description for every locale", () => {
  for (const p of puzzles) {
    for (const loc of LOCALES) {
      const desc = p.description?.[loc];
      expect(desc, `${p.id} missing description for ${loc}`).toBeDefined();
      expect(typeof desc, `${p.id} description[${loc}] not a string`).toBe("string");
      expect(desc.length, `${p.id} description[${loc}] is empty`).toBeGreaterThan(0);
    }
  }
});
```

- [ ] **Step 3: Run to confirm test fails on existing content**

Run: `npm test -- puzzles`
Expected: the new test FAILS for every puzzle (none have a description yet).

- [ ] **Step 4: Rewrite `src/content/puzzles.json`**

Add `description` to every puzzle entry. Use historically accurate one-paragraph blurbs in both locales. Reference text the implementer may use verbatim:

For `lepanto-1571`:
```json
"description": {
  "es": "La batalla de Lepanto (7 de octubre de 1571) fue una victoria naval decisiva de la Liga Santa — una coalición de potencias católicas liderada por España, Venecia y los Estados Pontificios — sobre el Imperio otomano en el golfo de Patras. Frenó la expansión otomana en el Mediterráneo y resonó en la cultura europea durante siglos; el propio Miguel de Cervantes combatió allí y perdió el uso de su mano izquierda.",
  "en": "The Battle of Lepanto (7 October 1571) was a decisive naval victory of the Holy League — a coalition of Catholic powers led by Spain, Venice, and the Papal States — over the Ottoman Empire in the Gulf of Patras. It halted Ottoman expansion in the Mediterranean and echoed through European culture for centuries; Miguel de Cervantes himself fought there and lost the use of his left hand."
}
```

For `constitucion-1853` (if present):
```json
"description": {
  "es": "La Constitución argentina de 1853 fue sancionada por el Congreso Constituyente de Santa Fe el 1 de mayo de 1853, sentando las bases del estado federal argentino tras décadas de guerras civiles. Inspirada parcialmente en la constitución estadounidense y en el pensamiento de Juan Bautista Alberdi, organizó el régimen republicano que, con reformas, sigue vigente.",
  "en": "Argentina's 1853 Constitution was sanctioned by the Constituent Congress of Santa Fe on 1 May 1853, laying the foundation of the Argentine federal state after decades of civil war. Partly inspired by the US Constitution and the writings of Juan Bautista Alberdi, it organised the republican system that, with amendments, remains in force."
}
```

If puzzles.json contains other entries not listed here, the implementer must write a comparable one-paragraph description for each in both locales. Each description should be factually accurate and 2-5 sentences.

- [ ] **Step 5: Run to confirm validation passes**

Run: `npm test -- puzzles`
Expected: all puzzle tests pass.

- [ ] **Step 6: Run full suite + build**

Run: `npm test && npm run build`
Expected: green.

- [ ] **Step 7: Commit**

```bash
git add src/game/types.ts src/content/
git commit -m "feat(content): per-locale description on every puzzle + validation"
```

---

## Task 3: i18n triviaTitle

**Files:**
- Modify: `src/i18n/strings.ts`, `src/i18n/__tests__/strings.test.ts`

**Interfaces:** `STRINGS[locale].triviaTitle: string`.

- [ ] **Step 1: Extend strings test**

Add a test (or extend an existing one) that asserts `triviaTitle` exists for every locale:

```ts
it("has triviaTitle for every locale", () => {
  for (const loc of LOCALES) {
    expect(typeof STRINGS[loc].triviaTitle).toBe("string");
    expect(STRINGS[loc].triviaTitle.length).toBeGreaterThan(0);
  }
});
```

(The existing "same top-level keys for every locale" test will also enforce parallel structure once we add the key to both bundles.)

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- strings`
Expected: FAIL — `triviaTitle` undefined.

- [ ] **Step 3: Update `src/i18n/strings.ts`**

Add `triviaTitle: "Sobre este puzzle"` to the `es` bundle and `triviaTitle: "About this puzzle"` to the `en` bundle. Place near the other top-level keys (e.g., next to `noPuzzle` or `appTitle`).

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- strings`
Expected: all strings tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/
git commit -m "feat(i18n): triviaTitle key for both locales"
```

---

## Task 4: TriviaBox component

**Files:**
- Create: `src/ui/TriviaBox.tsx`, `src/ui/TriviaBox.module.css`, `src/ui/__tests__/TriviaBox.test.tsx`

**Interfaces:**
- Consumes: `Puzzle`, `GameState` from `../game/types`; `Locale` from `../i18n/types`; `STRINGS` from `../i18n/strings`; `formatAnswer` from `./answer`; `ShareButton` from `./ShareButton`.
- Produces: `TriviaBox({ puzzle, gameState, puzzleNumber, url, locale }): JSX.Element`. Pure rendering.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TriviaBox } from "../TriviaBox";
import { GameState, Puzzle } from "../../game/types";

const puzzle: Puzzle = {
  id: "lepanto-1571",
  era: "modern",
  answer: { from: 1571, to: 1571 },
  hints: { es: ["a","b","c","d","e"], en: ["a","b","c","d","e"] },
  description: {
    es: "Descripción en español sobre Lepanto.",
    en: "English description about Lepanto.",
  },
};

const gameState: GameState = {
  puzzle,
  guesses: [{ year: 1571, distanceRatio: 0, bucket: "perfect", direction: "match" }],
  outcome: "won",
  hintsRevealed: 1,
};

describe("TriviaBox", () => {
  it("renders the Spanish title, description, formatted answer, and Share button", () => {
    render(
      <TriviaBox
        puzzle={puzzle}
        gameState={gameState}
        puzzleNumber={1}
        url="https://example.com/circa/"
        locale="es"
      />,
    );
    expect(screen.getByText("Sobre este puzzle")).toBeInTheDocument();
    expect(screen.getByText("Descripción en español sobre Lepanto.")).toBeInTheDocument();
    expect(screen.getByText("1571")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /compartir/i })).toBeInTheDocument();
  });

  it("renders the English title and description when locale is en", () => {
    render(
      <TriviaBox
        puzzle={puzzle}
        gameState={gameState}
        puzzleNumber={1}
        url="https://example.com/circa/"
        locale="en"
      />,
    );
    expect(screen.getByText("About this puzzle")).toBeInTheDocument();
    expect(screen.getByText("English description about Lepanto.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /share/i })).toBeInTheDocument();
  });

  it("renders a range answer with the en-dash", () => {
    const rangePuzzle: Puzzle = { ...puzzle, answer: { from: 1789, to: 1799 } };
    render(
      <TriviaBox
        puzzle={rangePuzzle}
        gameState={{ ...gameState, puzzle: rangePuzzle }}
        puzzleNumber={1}
        url="https://example.com/circa/"
        locale="en"
      />,
    );
    expect(screen.getByText("1789–1799")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failures**

Run: `npm test -- TriviaBox`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/ui/TriviaBox.module.css`**

```css
.frame {
  max-width: 520px;
  margin: 16px auto;
  background: #fafafa;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 24px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
}
.title { font-weight: 600; font-size: 16px; }
.answer { color: #888; font-size: 13px; font-variant-numeric: tabular-nums; }
.body { margin: 0 0 16px; line-height: 1.55; font-size: 14px; }
.actions { display: flex; justify-content: flex-end; }
@media (max-width: 480px) {
  .frame { margin: 12px; padding: 16px; border-radius: 8px; }
}
```

- [ ] **Step 4: Write `src/ui/TriviaBox.tsx`**

```tsx
import { GameState, Puzzle } from "../game/types";
import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import { formatAnswer } from "./answer";
import { ShareButton } from "./ShareButton";
import styles from "./TriviaBox.module.css";

export function TriviaBox({
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
}) {
  const s = STRINGS[locale];
  return (
    <div className={styles.frame}>
      <div className={styles.header}>
        <div className={styles.title}>{s.triviaTitle}</div>
        <div className={styles.answer}>{formatAnswer(puzzle.answer)}</div>
      </div>
      <p className={styles.body}>{puzzle.description[locale]}</p>
      <div className={styles.actions}>
        <ShareButton state={gameState} puzzleNumber={puzzleNumber} url={url} locale={locale} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run to verify pass**

Run: `npm test -- TriviaBox`
Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/ui/TriviaBox.tsx src/ui/TriviaBox.module.css src/ui/__tests__/TriviaBox.test.tsx
git commit -m "feat(ui): TriviaBox post-game card with description + share"
```

---

## Task 5: App wiring (TriviaBox + modal-on-first-finish)

**Files:**
- Modify: `src/App.tsx`, `src/__tests__/App.test.tsx`

**Interfaces:**
- `App.Game`: render `<TriviaBox>` below `<Board>` whenever `state.outcome !== "playing"`.
- `App.Game`: initial `modalOpen` is `false` when the persisted state already had a finished game for this puzzle on this date (i.e., `previouslyFinished` is true at mount). It's `true` only when the reducer transitions to finished during the session.

- [ ] **Step 1: Write the failing test**

Add a new test to `src/__tests__/App.test.tsx`:

```tsx
it("shows the TriviaBox without auto-opening the modal on reload of a finished game", async () => {
  // Seed localStorage with a finished v3 state for today's puzzle.
  const finishedState = {
    schemaVersion: 3,
    lastPlayedDate: "2026-06-20",
    lastResult: {
      puzzle: {
        id: "lepanto-1571",
        era: "modern",
        answer: { from: 1571, to: 1571 },
        hints: {
          es: ["..","..","..","..",".."],
          en: ["..","..","..","..",".."],
        },
        description: { es: "Trivia ES", en: "Trivia EN" },
      },
      guesses: [{ year: 1571, distanceRatio: 0, bucket: "perfect", direction: "match" }],
      outcome: "won",
      hintsRevealed: 1,
    },
    stats: { currentStreak: 1, maxStreak: 1, lastWinDate: "2026-06-20" },
    locale: "es",
  };
  window.localStorage.setItem("circa", JSON.stringify(finishedState));

  render(<App />);
  // TriviaBox visible
  expect(await screen.findByText("Sobre este puzzle")).toBeInTheDocument();
  // Modal should NOT be visible (its outcome message would be present if open)
  expect(screen.queryByText(/Ganaste en/i)).not.toBeInTheDocument();
});
```

(Note: this test seeds the puzzle's `hints` and `description` shape that App expects; if the actual puzzles.json content differs, the test fixture's `puzzle` block need only be structurally valid — the schedule lookup picks the real puzzle from puzzles.json; the seeded `lastResult.puzzle` is only used by the restore path. Verify which is which by reading App.tsx before adjusting.)

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- App`
Expected: the new test FAILS — TriviaBox isn't rendered and/or modal auto-opens.

- [ ] **Step 3: Update `src/App.tsx`**

In the `Game` component, find the initial-state computation for `modalOpen`. Currently it's:

```tsx
const [modalOpen, setModalOpen] = useState(state.outcome !== "playing");
```

Change it to be `false` when the persisted state already contained a finished game for today's puzzle:

```tsx
const wasPreviouslyFinished =
  persisted.lastPlayedDate === todayIso &&
  persisted.lastResult?.puzzle.id === puzzle.id &&
  persisted.lastResult?.outcome !== "playing";
const [modalOpen, setModalOpen] = useState(state.outcome !== "playing" && !wasPreviouslyFinished);
```

Then, render `<TriviaBox>` below the existing `<Board>` whenever the game has ended:

```tsx
import { TriviaBox } from "./ui/TriviaBox";
// ... in the return:
return (
  <>
    <Board ...existing props... />
    {state.outcome !== "playing" && (
      <TriviaBox
        puzzle={puzzle}
        gameState={state}
        puzzleNumber={puzzleNumber}
        url={url}
        locale={persisted.locale}
      />
    )}
    {modalOpen && (
      <StatsModal ...existing props... />
    )}
  </>
);
```

The existing useEffect that opens the modal when the game *transitions* to finished (`finishedNow && !previouslyFinished` → `setModalOpen(true)`) continues to work. Only the *initial* `modalOpen` value changes.

- [ ] **Step 4: Run to verify new test passes**

Run: `npm test -- App`
Expected: all App tests pass.

- [ ] **Step 5: Run full suite + build**

Run: `npm test && npm run build`
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/__tests__/App.test.tsx
git commit -m "feat(app): TriviaBox below Board after finish; modal only on first finish per session"
```

---

## Task 6: CLAUDE.md update

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update the authoring section**

In the "Authoring a new puzzle" JSON snippet, add `description` after `hints`. Replace the snippet with:

```json
{
  "id": "kebab-case-id-YYYY",
  "era": "modern",
  "answer": { "from": 1571, "to": 1571 },
  "hints": {
   "es": ["pista vaga 1", "...", "...", "...", "ancla específica 5"],
   "en": ["vague hint 1", "...", "...", "...", "specific anchor hint 5"]
  },
  "description": {
   "es": "Un párrafo de trivia sobre el evento, en español.",
   "en": "A paragraph of trivia about the event, in English."
  }
}
```

Add a new bullet below the existing ones in the authoring section:

> - `description` is one short paragraph (2-5 sentences) per locale, shown after the game ends. Required for every locale.

- [ ] **Step 2: Update the Project layout block**

In the file tree under `ui/`, append `TriviaBox.tsx` to the list of components:

```
    Hints.tsx, GuessTiles.tsx, GuessInput.tsx, ColorLegend.tsx, EraPill.tsx
    ShareButton.tsx, StatsModal.tsx, TriviaBox.tsx
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document description field and TriviaBox component"
```
