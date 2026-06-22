# Circa — Content Authoring CLI

**Date:** 2026-06-22
**Status:** Approved for implementation
**Builds on:** prior Circa specs (i18n, range-answers, directional-feedback, trivia-and-checkmark)

## Summary

A small TypeScript CLI wizard that creates a new puzzle by prompting field-by-field, validating as you type, and writing both `puzzles.json` and `schedule.json`. Reuses the project's existing era table and content-validation logic so the wizard's rules never drift from the test suite. Invoked via `npm run author`.

## Motivation

Hand-editing two JSON files for every puzzle is error-prone: id collisions, eras that don't match the answer year, malformed dates, missing locale entries. The wizard centralises those checks at the moment of authoring and removes the manual JSON formatting step.

## Scope

In scope:
- Create one new puzzle interactively.
- Validate id, era, answer range, hints, description, and schedule date as the user fills them.
- Append to `puzzles.json` and `schedule.json`.
- Run the existing Vitest content validation as a final sanity check.
- Stage the modified files via `git add` (no auto-commit).

Out of scope:
- Editing existing puzzles (hand-edit JSON or re-author).
- Removing puzzles.
- Reordering schedule entries.
- Importing from external sources, translation aids, spell-check.
- A GUI, browser form, or admin route in the deployed app.

## Tech choices

- Language: TypeScript, run via `tsx` (added as devDependency).
- Prompts library: `@inquirer/prompts`. Modern, ESM, small, has `input`, `select`, `editor` primitives.
- Single-file script, ~150-200 lines. No new subdirectories under `scripts/`.

## Invocation

```bash
npm run author
```

Maps to `tsx scripts/new-puzzle.ts` in `package.json` scripts.

Direct invocation also works: `npx tsx scripts/new-puzzle.ts`.

## Field flow

The wizard prompts for each field in order. Validation runs after each input; the prompt re-asks on failure with the reason.

1. **Puzzle id** — text. Rules: matches `/^[a-z0-9-]+$/`, not present in current `puzzles.json`.
2. **Era** — `select` from `["prehistory", "ancient", "medieval", "modern", "recent"]`. Each choice shows its inclusive range (e.g. `modern (1453–1788)`).
3. **Answer from** — integer. Must lie within the era's `[from, to)` (or for `recent`, `[from, currentYearArt()]`).
4. **Answer to** — integer. Default = same as `from`. Must be `>= from` and within the same era.
5. **Hints — Spanish (×5)** — five sequential `input` prompts. Each must be non-empty after trim.
6. **Hints — English (×5)** — five sequential `input` prompts. Each must be non-empty after trim.
7. **Description — Spanish** — `editor` prompt (pops `$EDITOR`). Non-empty after trim.
8. **Description — English** — `editor` prompt. Non-empty after trim.
9. **Schedule date** — `input`. Default = day after the latest existing scheduled date. Format `YYYY-MM-DD`, valid calendar date, not already in `schedule.json`.
10. **Confirm** — shows the assembled JSON puzzle entry and the schedule line. Confirms via `confirm` prompt.

If the user aborts at any point (Ctrl+C, confirm = no), no files are written.

## Validation

- **Inline:** each field's validator runs before the wizard moves on. Validators import from the project's existing modules:
  - `eraRange` from `src/game/eras.ts` — era membership.
  - `LOCALES` from `src/i18n/types.ts` — completeness of locale-keyed fields.
  - Direct read of `src/content/puzzles.json` and `src/content/schedule.json` for uniqueness checks.
- **Final pass:** after writing, the wizard spawns `npx vitest run src/content` (the existing content validation tests). On failure the wizard prints vitest's output and exits non-zero without rolling back — at that point the files are written and the user can fix by hand or revert via git. The inline validators should make this very unlikely to fire.

## File mutation

- **`puzzles.json`:** parse, push the new entry to the end of the array, write back with the same formatting (2-space indent, trailing newline). Implementation uses `JSON.parse` + `JSON.stringify(arr, null, 2) + "\n"`. Preserves existing entries verbatim.
- **`schedule.json`:** parse, add the new `date → id` entry, write back keyed by date (insertion order preserved; `JSON.stringify` keeps key insertion order, and `Object.keys` after parse is already in file order).
- **Git:** after both files are written and the vitest check passes, run `git add src/content/puzzles.json src/content/schedule.json`. No commit.

## Multi-line input via `$EDITOR`

`@inquirer/prompts` provides an `editor` prompt that:
- Writes the current default to a temp file.
- Spawns `$EDITOR` (falls back to `vi`).
- On editor exit, reads the file as the prompt's value.

This is the right primitive for the two description paragraphs. The temp file gets `.md` suffix so editors enable markdown-friendly highlighting and word wrap.

## Error handling

- Inline validation failures: re-prompt with the validation message inline.
- Unique-id collision: re-prompt.
- Schedule date collision: re-prompt.
- `git add` failure (e.g., not a git repo): print warning and continue. Don't fail the script.
- vitest spawn failure: print the captured output, exit code 1.

## Out-of-scope cleanup opportunity (optional, not required)

The current schedule entry for `2026-06-23` may still reference a puzzle id not in `puzzles.json` (older orphan). The wizard can detect this on startup and warn but does not auto-fix.

## File structure

| File | Change |
|---|---|
| `scripts/new-puzzle.ts` | New entry script (single file, ~150-200 lines) |
| `package.json` | Add `"author"` script; add `@inquirer/prompts` and `tsx` as devDependencies |
| `CLAUDE.md` | Under "Authoring a new puzzle": lead with `npm run author` as the preferred path; keep the manual-JSON instructions as a fallback |
| `scripts/__tests__/new-puzzle.test.ts` (optional) | Unit tests for the pure validators if extracted; full E2E is out of scope |

## Testing strategy

- The pure validators (id format, era membership, date format) are simple enough to test directly if extracted as exported functions. Add a small test file if doing so.
- The interactive prompt flow is not E2E tested. The wizard relies on the existing Vitest content-validation tests as the safety net — if a bug in the wizard ever produces an invalid puzzle, the next `npm test` fails immediately.
- Manual smoke test: run `npm run author`, complete one puzzle end-to-end, confirm the files are well-formed and `npm test` still passes.
