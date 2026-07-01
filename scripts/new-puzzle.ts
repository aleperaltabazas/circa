#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { input, editor, confirm } from "@inquirer/prompts";
import { Locale } from "../src/i18n/types";
import { today } from "../src/game/today";
import { Par, Puzzle, Schedule, YearRange } from "../src/game/types";
import {
  validateId,
  validateNonEmpty,
  validateDate,
  validateYearHasEra,
  validateSameEraRange,
  validatePar,
  eraOf,
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

function nextDateAfter(latest: string | undefined): string {
  if (!latest) return today();
  const [y, m, d] = latest.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().slice(0, 10);
}

async function promptHintArray(locale: Locale): Promise<[string, string, string, string, string]> {
  const hints: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const hint = await input({
      message: `Hint ${i}/5 (${locale})`,
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

  const answerFromStr = await input({
    message: "Answer (from)",
    validate: (v) => validateYearHasEra(Number(v)) ?? true,
  });
  const answerFrom = Number(answerFromStr);

  const answerToStr = await input({
    message: "Answer (to)",
    default: String(answerFrom),
    validate: (v) => validateSameEraRange(answerFrom, Number(v)) ?? true,
  });
  const answerTo = Number(answerToStr);

  const era = eraOf(answerFrom)!;
  console.log(`\nEra: ${era}`);

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

  const answer: YearRange = { from: answerFrom, to: answerTo };
  const newPuzzle: Puzzle = {
    id: id.trim(),
    era,
    answer,
    par,
    hints: { es: hintsEs, en: hintsEn },
    description: { es: descEs.trim(), en: descEn.trim() },
    ...(dateAnchored ? { dateAnchored: true } : {}),
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
  if (result.error) console.error("spawn error:", result.error.message);
  if (result.status !== 0) {
    console.error("\nFinal validation failed. Inspect the output above; the files have been written but are not staged.");
    process.exit(result.status ?? 1);
  }

  const gitResult = spawnSync(
    "git",
    ["add", "src/content/puzzles.json", "src/content/schedule.json"],
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
