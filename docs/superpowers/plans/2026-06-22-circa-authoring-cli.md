# Circa Authoring CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a `npm run author` CLI wizard that interactively creates a new puzzle, runs the same content-validation rules as the test suite, writes both JSON files, and `git add`s them for the user to review.

**Architecture:** Single TypeScript file `scripts/new-puzzle.ts` run via `tsx`. Imports `eraRange`, `LOCALES`, `currentYearArt` from `src/`; reads/writes `src/content/puzzles.json` and `src/content/schedule.json` directly. Validators live as small functions in the same file (or extracted into a sibling `scripts/authoring/validators.ts` if useful for testing). Final correctness gate is `npx vitest run src/content` spawned at the end.

**Tech Stack:** TypeScript + `tsx` runner + `@inquirer/prompts`. Node 20+.

## Global Constraints

- Single-file primary entry: `scripts/new-puzzle.ts`. Extract validators into a separate module only if they get tested independently.
- Use existing project sources for validation rules — no duplication of the era table or locale list.
- Prompts use `@inquirer/prompts` (`input`, `select`, `editor`, `confirm`).
- File writes preserve existing JSON formatting (2-space indent, trailing newline).
- No commit; just `git add`.
- The wizard fails closed: any inline validation failure re-prompts; any final-vitest failure exits non-zero with output.
- Wizard imports must not pull in jsdom or React. Keep it Node-only.

---

## Task 1: Add dependencies + npm script

**Files:**
- Modify: `package.json`

**Interfaces:** None.

- [ ] **Step 1: Add devDependencies**

Run from `/workspace/daily-year`:

```bash
npm install --save-dev @inquirer/prompts tsx
```

- [ ] **Step 2: Add the npm script**

Edit `package.json` so the `scripts` block includes:

```json
"author": "tsx scripts/new-puzzle.ts"
```

(Place it after `build`.)

- [ ] **Step 3: Sanity check**

Run: `npm run author` — should fail with "Cannot find module 'scripts/new-puzzle.ts'" or similar, since the file doesn't exist yet. That confirms the script wiring is right.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add tsx + @inquirer/prompts devDeps for authoring wizard"
```

---

## Task 2: Validator module

**Files:**
- Create: `scripts/authoring/validators.ts`, `scripts/__tests__/validators.test.ts`

**Interfaces:**
- Consumes: `Era`, `LOCALES` from `src/i18n/types`; `eraRange` from `src/game/eras`; `currentYearArt` from `src/game/today`.
- Produces (all pure):
  - `validateId(id: string, existingIds: string[]): string | null` — null = ok; string = error reason.
  - `validateYearInEra(year: number, era: Era): string | null`.
  - `validateAnswerRange(from: number, to: number, era: Era): string | null`.
  - `validateNonEmpty(value: string, fieldName: string): string | null`.
  - `validateDate(date: string, existingDates: string[]): string | null` — checks `/^\d{4}-\d{2}-\d{2}$/`, valid calendar date, not already in list.

- [ ] **Step 1: Write failing tests in `scripts/__tests__/validators.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import {
  validateId,
  validateYearInEra,
  validateAnswerRange,
  validateNonEmpty,
  validateDate,
} from "../authoring/validators";

describe("validateId", () => {
  it("accepts a kebab-case id not in use", () => {
    expect(validateId("magna-carta-1215", ["lepanto-1571"])).toBeNull();
  });
  it("rejects an empty id", () => {
    expect(validateId("", [])).toMatch(/empty|required/i);
  });
  it("rejects an id with invalid characters", () => {
    expect(validateId("Foo Bar", [])).toMatch(/kebab|characters/i);
  });
  it("rejects an id already in use", () => {
    expect(validateId("lepanto-1571", ["lepanto-1571"])).toMatch(/already/i);
  });
});

describe("validateYearInEra", () => {
  it("accepts a year inside the era", () => {
    expect(validateYearInEra(1571, "modern")).toBeNull();
  });
  it("rejects a year before the era", () => {
    const msg = validateYearInEra(1400, "modern");
    expect(msg).toMatch(/not in/i);
    expect(msg).toMatch(/modern/);
  });
  it("rejects a year after the era", () => {
    const msg = validateYearInEra(1800, "modern");
    expect(msg).toMatch(/not in/i);
  });
});

describe("validateAnswerRange", () => {
  it("accepts from < to within era", () => {
    expect(validateAnswerRange(1789, 1799, "recent")).toBeNull();
  });
  it("rejects from > to", () => {
    expect(validateAnswerRange(1800, 1789, "recent")).toMatch(/from.*to/i);
  });
  it("rejects when from is outside the era", () => {
    expect(validateAnswerRange(1400, 1571, "modern")).toMatch(/not in/i);
  });
  it("rejects when to is outside the era", () => {
    expect(validateAnswerRange(1571, 1800, "modern")).toMatch(/not in/i);
  });
});

describe("validateNonEmpty", () => {
  it("accepts non-empty text", () => {
    expect(validateNonEmpty("hello", "hint")).toBeNull();
  });
  it("rejects empty string", () => {
    expect(validateNonEmpty("", "hint")).toMatch(/hint/i);
  });
  it("rejects whitespace-only string", () => {
    expect(validateNonEmpty("   ", "hint")).toMatch(/hint/i);
  });
});

describe("validateDate", () => {
  it("accepts a valid date not in the list", () => {
    expect(validateDate("2026-12-31", ["2026-06-20"])).toBeNull();
  });
  it("rejects wrong format", () => {
    expect(validateDate("2026-6-1", [])).toMatch(/format/i);
  });
  it("rejects an invalid calendar date", () => {
    expect(validateDate("2026-02-30", [])).toMatch(/invalid/i);
  });
  it("rejects a duplicate", () => {
    expect(validateDate("2026-06-20", ["2026-06-20"])).toMatch(/already/i);
  });
});
```

- [ ] **Step 2: Run to verify failures**

Run: `npm test -- validators`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `scripts/authoring/validators.ts`**

```ts
import { Era } from "../../src/i18n/types";
import { LOCALES } from "../../src/i18n/types";
import { eraRange } from "../../src/game/eras";
import { currentYearArt } from "../../src/game/today";

void LOCALES; // imported so consumers can also pull it via the same module if desired

const ID_RE = /^[a-z0-9-]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateId(id: string, existingIds: string[]): string | null {
  if (!id) return "id is required";
  if (!ID_RE.test(id)) return "id must be kebab-case (lowercase letters, digits, hyphens)";
  if (existingIds.includes(id)) return `id "${id}" is already in use`;
  return null;
}

export function validateYearInEra(year: number, era: Era): string | null {
  if (!Number.isInteger(year)) return "year must be an integer";
  const { from, to } = eraRange(era, currentYearArt());
  if (year < from || year >= to) {
    return `year ${year} is not in era ${era} [${from}, ${to})`;
  }
  return null;
}

export function validateAnswerRange(from: number, to: number, era: Era): string | null {
  if (!Number.isInteger(from) || !Number.isInteger(to)) return "from and to must be integers";
  if (from > to) return "from must be ≤ to";
  const fromMsg = validateYearInEra(from, era);
  if (fromMsg) return fromMsg;
  const toMsg = validateYearInEra(to, era);
  if (toMsg) return toMsg;
  return null;
}

export function validateNonEmpty(value: string, fieldName: string): string | null {
  if (!value || !value.trim()) return `${fieldName} must not be empty`;
  return null;
}

export function validateDate(date: string, existingDates: string[]): string | null {
  if (!DATE_RE.test(date)) return "date format must be YYYY-MM-DD";
  const [y, m, d] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  if (
    parsed.getUTCFullYear() !== y ||
    parsed.getUTCMonth() !== m - 1 ||
    parsed.getUTCDate() !== d
  ) {
    return `invalid calendar date: ${date}`;
  }
  if (existingDates.includes(date)) return `date ${date} is already scheduled`;
  return null;
}
```

(The `void LOCALES` line is a hack to keep the import; if the linter complains, remove it and re-import where needed.)

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- validators`
Expected: all validator tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/
git commit -m "feat(authoring): validator module"
```

---

## Task 3: Wizard entry script

**Files:**
- Create: `scripts/new-puzzle.ts`

**Interfaces:**
- Consumes: validators from `./authoring/validators`; `Era`, `LOCALES` from `src/i18n/types`; `eraRange` from `src/game/eras`; `currentYearArt` from `src/game/today`; `Puzzle`, `Schedule` from `src/game/types`.
- Side effects: reads/writes `src/content/puzzles.json` and `src/content/schedule.json`; spawns `npx vitest run src/content`; runs `git add`.

- [ ] **Step 1: Write `scripts/new-puzzle.ts`**

```ts
#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { input, select, editor, confirm } from "@inquirer/prompts";
import { Era, Locale, LOCALES } from "../src/i18n/types";
import { eraRange } from "../src/game/eras";
import { currentYearArt } from "../src/game/today";
import { Puzzle, Schedule, YearRange } from "../src/game/types";
import {
  validateId,
  validateYearInEra,
  validateAnswerRange,
  validateNonEmpty,
  validateDate,
} from "./authoring/validators";

const PROJECT_ROOT = resolve(import.meta.dirname ?? ".", "..");
const PUZZLES_PATH = resolve(PROJECT_ROOT, "src/content/puzzles.json");
const SCHEDULE_PATH = resolve(PROJECT_ROOT, "src/content/schedule.json");

function loadPuzzles(): Puzzle[] {
  return JSON.parse(readFileSync(PUZZLES_PATH, "utf8")) as Puzzle[];
}

function loadSchedule(): Schedule {
  return JSON.parse(readFileSync(SCHEDULE_PATH, "utf8")) as Schedule;
}

function eraLabel(era: Era): string {
  const { from, to } = eraRange(era, currentYearArt());
  return `${era} (${from}–${to - 1})`;
}

function nextDateAfter(latest: string | undefined): string {
  if (!latest) {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  }
  const [y, m, d] = latest.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().slice(0, 10);
}

async function promptHintArray(locale: Locale): Promise<[string, string, string, string, string]> {
  const labels = locale === "es" ? "es" : "en";
  const hints: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const hint = await input({
      message: `Hint ${i}/5 (${labels})`,
      validate: (v) => validateNonEmpty(v, `hint ${i}`) ?? true,
    });
    hints.push(hint.trim());
  }
  return hints as [string, string, string, string, string];
}

async function main() {
  const puzzles = loadPuzzles();
  const schedule = loadSchedule();
  const existingIds = puzzles.map((p) => p.id);
  const existingDates = Object.keys(schedule);
  const latestDate = [...existingDates].sort().at(-1);

  console.log("Circa — new puzzle wizard\n");

  const id = await input({
    message: "Puzzle id (kebab-case, e.g. lepanto-1571)",
    validate: (v) => validateId(v.trim(), existingIds) ?? true,
  });

  const era = (await select({
    message: "Era",
    choices: LOCALES.length
      ? (["prehistory", "ancient", "medieval", "modern", "recent"] as const).map((e) => ({
          name: eraLabel(e),
          value: e,
        }))
      : [],
  })) as Era;

  const answerFromStr = await input({
    message: "Answer (from)",
    validate: (v) => {
      const n = Number(v);
      return validateYearInEra(n, era) ?? true;
    },
  });
  const answerFrom = Number(answerFromStr);

  const answerToStr = await input({
    message: "Answer (to)",
    default: String(answerFrom),
    validate: (v) => {
      const n = Number(v);
      return validateAnswerRange(answerFrom, n, era) ?? true;
    },
  });
  const answerTo = Number(answerToStr);

  console.log("\nHints in Spanish (5, vague → specific):");
  const hintsEs = await promptHintArray("es");
  console.log("\nHints in English (5, vague → specific):");
  const hintsEn = await promptHintArray("en");

  console.log("\nDescription in Spanish — your $EDITOR will open.");
  const descEs = await editor({
    message: "Description (es)",
    postfix: ".md",
    validate: (v) => validateNonEmpty(v, "description (es)") ?? true,
  });

  console.log("\nDescription in English — your $EDITOR will open.");
  const descEn = await editor({
    message: "Description (en)",
    postfix: ".md",
    validate: (v) => validateNonEmpty(v, "description (en)") ?? true,
  });

  const date = await input({
    message: "Schedule date (YYYY-MM-DD)",
    default: nextDateAfter(latestDate),
    validate: (v) => validateDate(v.trim(), existingDates) ?? true,
  });

  const answer: YearRange = { from: answerFrom, to: answerTo };
  const newPuzzle: Puzzle = {
    id: id.trim(),
    era,
    answer,
    hints: { es: hintsEs, en: hintsEn },
    description: { es: descEs.trim(), en: descEn.trim() },
  };

  console.log("\nNew puzzle:\n" + JSON.stringify(newPuzzle, null, 2));
  console.log(`\nSchedule entry: "${date}": "${newPuzzle.id}"\n`);

  const ok = await confirm({ message: "Write to puzzles.json and schedule.json?", default: true });
  if (!ok) {
    console.log("Aborted. No files written.");
    process.exit(0);
  }

  puzzles.push(newPuzzle);
  schedule[date] = newPuzzle.id;
  writeFileSync(PUZZLES_PATH, JSON.stringify(puzzles, null, 2) + "\n", "utf8");
  writeFileSync(SCHEDULE_PATH, JSON.stringify(schedule, null, 2) + "\n", "utf8");

  console.log("Files written. Running final validation…");
  const result = spawnSync("npx", ["vitest", "run", "src/content"], {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    console.error("\nFinal validation failed. Inspect the output above; the files have been written but are not staged.");
    process.exit(result.status ?? 1);
  }

  const gitResult = spawnSync(
    "git",
    ["add", "src/content/puzzles.json", "src/content/schedule.json"],
    { cwd: PROJECT_ROOT, stdio: "inherit" },
  );
  if (gitResult.status !== 0) {
    console.warn("\nWarning: `git add` failed. The files are still written; you can stage manually.");
  }
  console.log("\nDone. Review with `git diff --staged` and commit when you're happy.");
}

main().catch((e) => {
  // Inquirer aborts (Ctrl+C) throw with a specific shape; print a friendly message.
  if (e?.name === "ExitPromptError") {
    console.log("\nAborted.");
    process.exit(130);
  }
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Smoke test the wizard manually**

Run: `npm run author`. Author one throwaway puzzle end-to-end. Confirm:
- Every prompt validates as designed (try entering an invalid era year, a duplicate id, a duplicate date, an empty hint — confirm each is rejected).
- The puzzle preview renders correctly.
- Both JSON files are updated.
- The final vitest run passes.
- `git add` succeeds.

Revert any test puzzle before committing the wizard:

```bash
git restore --staged --worktree src/content/puzzles.json src/content/schedule.json
```

- [ ] **Step 3: Commit the script**

```bash
git add scripts/new-puzzle.ts
git commit -m "feat(authoring): CLI wizard for new puzzles"
```

---

## Task 4: CLAUDE.md update

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update the "Authoring a new puzzle" section**

Replace the existing numbered steps with a wizard-led flow, keeping the manual editing as a secondary path:

> ## Authoring a new puzzle
>
> ### Preferred path: the wizard
>
> Run `npm run author` and follow the prompts. The wizard validates each field as you go (era ↔ answer year, id uniqueness, locale completeness, date uniqueness), pops `$EDITOR` for the two description paragraphs, and writes both JSON files. It runs the content-validation test suite as a final sanity check and stages the files via `git add`. You then `git diff --staged` and commit when you're happy.
>
> ### Manual path (fallback)
>
> [keep the existing JSON snippet and bullets here as-is]

- [ ] **Step 2: Add `Commands` entry**

Under the "Commands" section, add:

```
- `npm run author` — interactive wizard to create a new puzzle
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document npm run author wizard"
```
