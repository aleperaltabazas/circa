# Win/Lose Fanfare Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the end-of-game modal show "You got it!" + confetti on a win and "You ran out of attempts" on a loss, replacing the flat single-line outcome strings.

**Architecture:** Split the existing single `outcomeWin(g)` / `outcomeLoss(a)` i18n functions into headline strings and sub-text functions. Update `StatsModal` to render a headline + sub-text layout and fire `canvas-confetti` once on mount when the outcome is `"won"`.

**Tech Stack:** React 18, TypeScript, CSS Modules, Vitest + @testing-library/react, `canvas-confetti` (new).

## Global Constraints

- Node 20+. Run `npm test` to verify tests pass after every task. Run `npm run build` to verify typecheck passes.
- All user-facing strings must exist in both `es` and `en` locales in `src/i18n/strings.ts`.
- No component library. Styles go in the component's `.module.css` file.
- Pure modules (`scoring`, `reducer`, etc.) must stay pure — no side effects.
- Working directory for all commands: `/workspace/daily-year`.

---

### Task 1: Install canvas-confetti

**Files:**
- Modify: `package.json` (runtime dep added by npm)
- Modify: `package-lock.json` (lockfile updated by npm)

**Interfaces:**
- Produces: `import confetti from "canvas-confetti"` is resolvable with full TypeScript types

- [x] **Step 1: Install the package**

```bash
cd /workspace/daily-year && npm install canvas-confetti && npm install --save-dev @types/canvas-confetti
```

Expected output: npm prints added packages, no errors.

- [x] **Step 2: Verify types resolve**

```bash
cd /workspace/daily-year && npx tsc --noEmit
```

Expected: exits 0 (no type errors).

- [x] **Step 3: Commit**

```bash
cd /workspace/daily-year && git add package.json package-lock.json && git commit -m "chore: add canvas-confetti dependency"
```

---

### Task 2: Update i18n strings

**Files:**
- Modify: `src/i18n/strings.ts`
- Modify: `src/i18n/__tests__/strings.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces (used by Task 3):
  - `STRINGS[locale].outcomeWinHeadline` → `string`
  - `STRINGS[locale].outcomeWinSub(g: number)` → `string`
  - `STRINGS[locale].outcomeLossHeadline` → `string`
  - `STRINGS[locale].outcomeLossSub(a: string)` → `string`
  - `outcomeWin` and `outcomeLoss` keys are **removed**

- [x] **Step 1: Update strings.ts**

Replace the `outcomeWin` and `outcomeLoss` entries in both locales. The full updated `STRINGS` export for the affected lines (keep everything else unchanged):

In the `es` object, replace:
```ts
    outcomeWin: (g: number) => `Ganaste en ${g}/5`,
    outcomeLoss: (a: string) => `Se terminó — la respuesta era ${a}`,
```
with:
```ts
    outcomeWinHeadline: "¡Lo lograste!",
    outcomeWinSub: (g: number) => `en ${g}/5`,
    outcomeLossHeadline: "Te quedaste sin intentos",
    outcomeLossSub: (a: string) => `La respuesta era ${a}`,
```

In the `en` object, replace:
```ts
    outcomeWin: (g: number) => `You won in ${g}/5`,
    outcomeLoss: (a: string) => `Game over — the answer was ${a}`,
```
with:
```ts
    outcomeWinHeadline: "You got it!",
    outcomeWinSub: (g: number) => `in ${g}/5`,
    outcomeLossHeadline: "You ran out of attempts",
    outcomeLossSub: (a: string) => `The answer was ${a}`,
```

- [x] **Step 2: Update strings.test.ts**

The test at line 50–51 calls `s.outcomeWin(3)` and `s.outcomeLoss("1571")`. Replace those two assertions with ones for the new keys:

```ts
      expect(s.outcomeWinSub(3)).toMatch(/3/);
      expect(s.outcomeLossSub("1571")).toMatch(/1571/);
```

The full updated block (replace lines 44–54 in the test file):
```ts
  it("renders parameterized strings without leaking placeholders", () => {
    for (const loc of LOCALES) {
      const s = STRINGS[loc];
      expect(s.rangeHint(1453, 1788)).toMatch(/1453/);
      expect(s.rangeHint(1453, 1788)).toMatch(/1788/);
      expect(s.puzzleMeta(42, "2026-06-20")).toMatch(/42/);
      expect(s.outcomeWinSub(3)).toMatch(/3/);
      expect(s.outcomeLossSub("1571")).toMatch(/1571/);
      expect(s.shareTail("https://x.test/")).toMatch(/https:\/\/x\.test\//);
    }
  });
```

- [x] **Step 3: Run tests**

```bash
cd /workspace/daily-year && npm test
```

Expected: all tests pass. If `App.test.tsx` fails because it still looks for `/Ganaste en/`, that will be fixed in Task 3 — it is acceptable for it to fail here only if you understand why; otherwise proceed anyway.

- [x] **Step 4: Commit**

```bash
cd /workspace/daily-year && git add src/i18n/strings.ts src/i18n/__tests__/strings.test.ts && git commit -m "feat: split outcome strings into headline + sub-text"
```

---

### Task 3: Update StatsModal layout, confetti, and fix App tests

**Files:**
- Modify: `src/ui/StatsModal.tsx`
- Modify: `src/ui/StatsModal.module.css`
- Modify: `src/__tests__/App.test.tsx`

**Interfaces:**
- Consumes:
  - `STRINGS[locale].outcomeWinHeadline` → `string`
  - `STRINGS[locale].outcomeWinSub(g: number)` → `string`
  - `STRINGS[locale].outcomeLossHeadline` → `string`
  - `STRINGS[locale].outcomeLossSub(a: string)` → `string`
  - `import confetti from "canvas-confetti"`
- Produces: nothing (leaf UI component)

- [x] **Step 1: Update StatsModal.tsx**

Replace the full file content with:

```tsx
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { GameState, Stats } from "../game/types";
import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import { ShareButton } from "./ShareButton";
import { formatAnswer } from "./answer";
import styles from "./StatsModal.module.css";

export function StatsModal({
  stats,
  gameState,
  puzzleNumber,
  url,
  locale,
  onClose,
}: {
  stats: Stats;
  gameState: GameState;
  puzzleNumber: number;
  url: string;
  locale: Locale;
  onClose: () => void;
}) {
  const s = STRINGS[locale];

  const won = gameState.outcome === "won";
  const headline = won ? s.outcomeWinHeadline : s.outcomeLossHeadline;
  const sub = won
    ? s.outcomeWinSub(gameState.guesses.length)
    : s.outcomeLossSub(formatAnswer(gameState.puzzle.answer));

  useEffect(() => {
    if (won) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.3 } });
    }
  }, [won]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{s.appTitle} #{puzzleNumber}</h2>
        <p className={styles.outcomeHeadline}>{headline}</p>
        <p className={styles.outcomeSub}>{sub}</p>
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{stats.currentStreak}</div>
            <div className={styles.statLabel}>{s.currentStreak}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{stats.maxStreak}</div>
            <div className={styles.statLabel}>{s.maxStreak}</div>
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.close} type="button" onClick={onClose}>{s.close}</button>
          <ShareButton state={gameState} puzzleNumber={puzzleNumber} url={url} locale={locale} />
        </div>
      </div>
    </div>
  );
}
```

- [x] **Step 2: Update StatsModal.module.css**

Replace the `.outcome` rule with two new rules (keep everything else unchanged):

Remove:
```css
.outcome { font-size: 16px; margin: 0 0 16px; }
```

Add:
```css
.outcomeHeadline { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
.outcomeSub      { font-size: 14px; color: #555; margin: 0 0 16px; }
```

- [x] **Step 3: Mock canvas-confetti in App.test.tsx and fix text assertions**

`canvas-confetti` creates a real canvas element, which JSDOM doesn't support. Add a vi.mock at the top of the test file and fix the two text assertions that still reference the old string "Ganaste en".

Replace the full `src/__tests__/App.test.tsx` with:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

beforeEach(() => {
  window.localStorage.clear();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-06-20T15:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("App – previously finished game (reload)", () => {
  it("shows TriviaBox but not StatsModal when reloading a finished game", async () => {
    const persisted = {
      schemaVersion: 3,
      lastPlayedDate: "2026-06-20",
      lastResult: {
        puzzle: {
          id: "lepanto-1571",
          era: "modern",
          answer: { from: 1571, to: 1571 },
          hints: {
            es: ["pista 1", "pista 2", "pista 3", "pista 4", "pista 5"],
            en: ["hint 1", "hint 2", "hint 3", "hint 4", "hint 5"],
          },
          description: { es: "desc es", en: "desc en" },
        },
        guesses: [{ year: 1571, bucket: "perfect", distanceRatio: 0, direction: "match" }],
        outcome: "won",
        hintsRevealed: 1,
      },
      stats: { currentStreak: 1, maxStreak: 1, lastWinDate: "2026-06-20" },
      locale: "es",
    };
    window.localStorage.setItem("circa", JSON.stringify(persisted));

    render(<App />);

    expect(await screen.findByText("Sobre este puzzle")).toBeInTheDocument();
    // StatsModal must NOT be open (no win headline)
    expect(screen.queryByText("¡Lo lograste!")).toBeNull();
  });
});

describe("App", () => {
  it("renders the board for today's puzzle in Spanish by default", async () => {
    render(<App />);
    expect(await screen.findByText(/Circa/i)).toBeInTheDocument();
    expect(screen.getByText("moderna")).toBeInTheDocument();
    expect(screen.getByText(/imperio otomano/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /adivinar/i })).toBeInTheDocument();
  });

  it("reveals the next hint after a wrong guess (Spanish)", async () => {
    render(<App />);
    await screen.findByText(/imperio otomano/i);
    await userEvent.type(screen.getByRole("spinbutton"), "1500");
    await userEvent.click(screen.getByRole("button", { name: /adivinar/i }));
    expect(screen.getByText(/imperio bizantino/i)).toBeInTheDocument();
    expect(screen.getByText("1500")).toBeInTheDocument();
  });

  it("shows both StatsModal and TriviaBox after finishing a fresh game", async () => {
    render(<App />);
    await screen.findByText(/imperio otomano/i);
    await userEvent.type(screen.getByRole("spinbutton"), "1571");
    await userEvent.click(screen.getByRole("button", { name: /adivinar/i }));
    // StatsModal auto-opens on fresh finish — check for new win headline
    expect(await screen.findByText("¡Lo lograste!")).toBeInTheDocument();
    expect(screen.getByText("Sobre este puzzle")).toBeInTheDocument();
  });
});
```

- [x] **Step 4: Run all tests**

```bash
cd /workspace/daily-year && npm test
```

Expected: all tests pass with no errors.

- [x] **Step 5: Typecheck**

```bash
cd /workspace/daily-year && npm run build
```

Expected: build succeeds, no TypeScript errors.

- [x] **Step 6: Commit**

```bash
cd /workspace/daily-year && git add src/ui/StatsModal.tsx src/ui/StatsModal.module.css src/__tests__/App.test.tsx && git commit -m "feat: animated win/lose outcome in StatsModal with confetti"
```
