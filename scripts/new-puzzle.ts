#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { input, editor, confirm, select } from "@inquirer/prompts";
import JSON5 from "json5";
import { today } from "../src/game/today";
import { Answer, Margin, NamedMargin, Par, Puzzle, Schedule } from "../src/game/types";
import {
  validateId,
  validateNonEmpty,
  validateDate,
  validateYearHasEra,
  validateMargin,
  validatePar,
  eraOf,
} from "./authoring/validators";

const PROJECT_ROOT = resolve(import.meta.dirname ?? ".", "..");
const PUZZLES_PATH = resolve(PROJECT_ROOT, "src/content/puzzles.json5");
const SCHEDULE_PATH = resolve(PROJECT_ROOT, "src/content/schedule.json5");

function loadPuzzles(): Puzzle[] {
  return JSON5.parse(readFileSync(PUZZLES_PATH, "utf8")) as Puzzle[];
}

function loadSchedule(): Schedule {
  return JSON5.parse(readFileSync(SCHEDULE_PATH, "utf8")) as Schedule;
}

function nextDateAfter(latest: string | undefined): string {
  if (!latest) return today();
  const [y, m, d] = latest.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().slice(0, 10);
}

async function promptHintArray(): Promise<[string, string, string, string, string]> {
  const hints: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const hint = await input({
      message: `Hint ${i}/5`,
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

  const answerYearStr = await input({
    message: "Answer year",
    validate: (v) => validateYearHasEra(Number(v)) ?? true,
  });
  const answerYear = Number(answerYearStr);

  const marginChoice = await select({
    message: "Answer tolerance",
    choices: [
      { name: "exact (single year)", value: "" },
      { name: "luster — 5-year period  (e.g. 1927 → 1925–1929)", value: "luster" },
      { name: "decade                  (e.g. 1927 → 1920–1929)", value: "decade" },
      { name: "century                 (e.g. 1927 → 1900–1999)", value: "century" },
      { name: "millennium              (e.g. 1927 → 1000–1999)", value: "millennium" },
      { name: "custom fraction (0–0.2 of era width)", value: "custom" },
    ],
  });

  let margin: Margin | undefined;
  if (marginChoice === "custom") {
    const fracStr = await input({
      message: "Fraction (0–0.2)",
      validate: (v) => validateMargin(v) ?? true,
    });
    margin = Number(fracStr);
  } else if (marginChoice !== "") {
    margin = marginChoice as NamedMargin;
  }

  const era = eraOf(answerYear)!;
  console.log(`\nEra: ${era}`);

  console.log("\nHints (5, vague → specific):");
  const hintsEs = await promptHintArray();

  console.log("\nDescription — your $EDITOR will open.");
  const descEs = await editor({
    message: "Description",
    postfix: ".md",
    validate: (v) => validateNonEmpty(v, "description") ?? true,
  });

  const date = await input({
    message: "Schedule date (YYYY-MM-DD)",
    default: nextDateAfter(latestDate),
    validate: (v) => validateDate(v.trim(), existingDates) ?? true,
  });

  const dateAnchored = await confirm({
    message: "Did the event happen on the same calendar date as the schedule date?",
    default: false,
  });

  const parStr = await input({
    message: "Par (1–5) — expected hint number to solve",
    default: "3",
    validate: (v) => validatePar(Number(v)) ?? true,
  });
  const par = Number(parStr) as Par;

  const answer: Answer = margin != null ? { year: answerYear, margin } : { year: answerYear };
  const newPuzzle: Puzzle = {
    id: id.trim(),
    era,
    answer,
    par,
    hints: { es: hintsEs },
    description: { es: descEs.trim() },
    ...(dateAnchored ? { dateAnchored: true } : {}),
  };

  console.log("\nNew puzzle:\n" + JSON.stringify(newPuzzle, null, 2));
  console.log(`\nSchedule entry: "${date}": "${newPuzzle.id}"\n`);

  const ok = await confirm({ message: "Write to puzzles.json5 and schedule.json5?", default: true });
  if (!ok) {
    console.log("Aborted. No files written.");
    process.exit(0);
  }

  puzzles.push(newPuzzle);
  schedule[date] = newPuzzle.id;
  writeFileSync(PUZZLES_PATH, JSON5.stringify(puzzles, null, 2) + "\n", "utf8");
  writeFileSync(SCHEDULE_PATH, JSON5.stringify(schedule, null, 2) + "\n", "utf8");

  console.log("Files written. Running final validation…");
  const result = spawnSync("npx", ["vitest", "run", "src/content"], {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
  });
  if (result.error) console.error("spawn error:", result.error.message);
  if (result.status !== 0) {
    console.error("\nFinal validation failed. Inspect the output above; the files have been written but are not staged.");
    process.exit(result.status ?? 1);
  }

  const gitResult = spawnSync(
    "git",
    ["add", "src/content/puzzles.json5", "src/content/schedule.json5"],
    { cwd: PROJECT_ROOT, stdio: "inherit" },
  );
  if (gitResult.error) console.error("spawn error:", gitResult.error.message);
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
