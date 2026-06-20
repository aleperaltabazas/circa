# Circa — i18n Design

**Date:** 2026-06-20
**Status:** Approved for implementation
**Builds on:** [2026-06-19-daily-year-design.md](./2026-06-19-daily-year-design.md)

## Summary

Add Spanish/English internationalization to Circa. The player picks the locale via a toggle in the header (default Spanish, no auto-detection). UI labels and puzzle hints both translate. Puzzles must be authored in both locales — a build-time test fails if any is incomplete.

## Locales

- `Locale = "es" | "en"`. `LOCALES = ["es", "en"]`. `DEFAULT_LOCALE = "es"`.
- No auto-detection from `navigator.language`. The player's stored choice (or `DEFAULT_LOCALE` on first visit) is authoritative.
- No URL-based locale routing.

## Puzzle data shape

```json
{
  "id": "lepanto-1571",
  "era": "modern",
  "answer": 1571,
  "hints": {
    "es": ["...", "...", "...", "...", "..."],
    "en": ["...", "...", "...", "...", "..."]
  }
}
```

- `Puzzle.hints` is `Record<Locale, [string, string, string, string, string]>`.
- All other puzzle fields (`id`, `era`, `answer`) are locale-independent.

### Validation

A Vitest test asserts every puzzle in `puzzles.json` has an array of exactly 5 hints for every entry in `LOCALES`. Failing this test fails the GH Actions build, which gates deploy.

No runtime fallback: if a hint is missing at runtime, the validation test should have caught it. If somehow it slips through, the missing-key render shows the JS undefined-to-string output ("undefined") — visible enough to notice in QA.

## UI strings

Single source of truth: `src/i18n/strings.ts`:

```ts
import type { Locale } from "./types";

export const STRINGS = {
  es: {
    appTitle: "Circa",
    guess: "Adivinar",
    share: "Compartir",
    copied: "¡Copiado!",
    close: "Cerrar",
    currentStreak: "Actual",
    maxStreak: "Máxima",
    rangeHint: (min: number, max: number) => `Ingresá un año entre ${min} y ${max}`,
    locked: "Bloqueada — adiviná para revelar",
    puzzleMeta: (n: number, date: string) => `Puzzle #${n} — ${date}`,
    legendFar: "muy lejos",
    legendCloser: "más cerca",
    legendExact: "exacto",
    noPuzzle: "No hay puzzle hoy, volvé mañana.",
    outcomeWin: (g: number) => `Ganaste en ${g}/5`,
    outcomeLoss: (a: number) => `Se terminó — la respuesta era ${a}`,
    shareTail: (url: string) => `jugá en ${url}`,
    eraLabel: {
      prehistory: "prehistoria",
      ancient: "antigua",
      medieval: "medieval",
      modern: "moderna",
      recent: "reciente",
    },
  },
  en: {
    appTitle: "Circa",
    guess: "Guess",
    share: "Share",
    copied: "Copied!",
    close: "Close",
    currentStreak: "Current",
    maxStreak: "Max",
    rangeHint: (min: number, max: number) => `Enter a year between ${min} and ${max}`,
    locked: "Locked — guess to reveal",
    puzzleMeta: (n: number, date: string) => `Puzzle #${n} — ${date}`,
    legendFar: "far off",
    legendCloser: "closer",
    legendExact: "exact",
    noPuzzle: "No puzzle today, check back tomorrow.",
    outcomeWin: (g: number) => `You won in ${g}/5`,
    outcomeLoss: (a: number) => `Game over — the answer was ${a}`,
    shareTail: (url: string) => `play at ${url}`,
    eraLabel: {
      prehistory: "prehistory",
      ancient: "ancient",
      medieval: "medieval",
      modern: "modern",
      recent: "recent",
    },
  },
} as const;

export type StringsBundle = typeof STRINGS["es"];
```

Consumers read `STRINGS[locale].xxx` directly. No `t()` indirection — the bundle is a typed object, so call sites like `STRINGS[locale].guess` are fully type-checked. Parameterized strings are functions that take the args inline. The `as const` plus parallel structure means TypeScript will catch any key missing from a locale at compile time when `STRINGS` is used.

### Brand-stable text

These do NOT translate:
- App title in the share string: always `Circa #N`.
- Score: always `N/5` or `X/5`.
- Emoji squares.

## Locale toggle UI

A `<LocaleToggle>` component renders a native `<select>` with two options, `ES` and `EN`. Placed in the Board header, immediately to the right of the `EraPill`. Calls `onChange(locale)` when the value changes.

## Storage migration

- `schemaVersion` bumps from `1` to `2`.
- `PersistedShape` gains `locale: Locale`.
- `load()` migration: when stored `schemaVersion === 1`, return `{ ...stored, schemaVersion: 2, locale: DEFAULT_LOCALE }`. Any other version mismatch returns `EMPTY` (now `EMPTY.locale === DEFAULT_LOCALE`).

## State and component changes

- `App` owns `locale: Locale`. On mount: `load(storage).locale`. On change: persist via `save`.
- `Game` and `Board` receive `locale` as a prop.
- `Board` selects `puzzle.hints[locale]` and passes that string array to `Hints`. `Hints` itself stays locale-agnostic (it receives a `string[]` and a `locked` label).
- `EraPill` accepts `locale` and renders `STRINGS[locale].eraLabel[era]` (uppercased via existing CSS).
- `GuessInput`, `StatsModal`, `ShareButton`, `Board`, and `App` (no-puzzle state) consume `STRINGS[locale]` for all visible text.
- `formatShare(state, puzzleNumber, url, locale)` — new `locale` arg; uses `STRINGS[locale].shareTail`.

### Components that change

| File | Change |
|---|---|
| `src/game/types.ts` | `Puzzle.hints` becomes `Record<Locale, [string,...]>` |
| `src/i18n/types.ts` | New: `Locale`, `LOCALES`, `DEFAULT_LOCALE` |
| `src/i18n/strings.ts` | New: `STRINGS`, `StringsBundle` |
| `src/storage/localStorage.ts` | Schema v2 + migration + `locale` field |
| `src/share/formatShare.ts` | Takes `locale` arg |
| `src/ui/LocaleToggle.tsx` (+ css) | New component |
| `src/ui/Board.tsx` | Selects locale hints, adds toggle, plumbs locale prop |
| `src/ui/Hints.tsx` | Accepts `locked` label as prop |
| `src/ui/GuessInput.tsx` | Accepts `locale`; uses `STRINGS[locale].rangeHint` + `.guess` |
| `src/ui/EraPill.tsx` | Accepts `locale`; uses `STRINGS[locale].eraLabel` |
| `src/ui/ColorLegend.tsx` | Accepts `locale`; uses legend labels |
| `src/ui/ShareButton.tsx` | Accepts `locale`; uses `.share` / `.copied`; passes `locale` to `formatShare` |
| `src/ui/StatsModal.tsx` | Accepts `locale`; uses `.outcomeWin/Loss`, `.currentStreak`, `.maxStreak`, `.close` |
| `src/App.tsx` | Owns `locale` state; persists on change; passes down |
| `src/content/puzzles.json` | Rewrite each puzzle's `hints` as `{ es, en }` |
| `src/content/__tests__/puzzles.test.ts` | New validation test |

## Testing

- New unit tests:
  - `src/i18n/__tests__/strings.test.ts` — sanity: every locale has every key.
  - `src/content/__tests__/puzzles.test.ts` — every puzzle has 5 hints per locale.
  - `src/share/__tests__/formatShare.test.ts` — extend to cover both locales' `shareTail`.
  - `src/storage/__tests__/localStorage.test.ts` — v1→v2 migration: stored v1 data loads with `locale: "es"`.
- Component tests for `EraPill`, `GuessInput`, `ColorLegend`, `StatsModal`, `ShareButton` — extend to assert Spanish strings render by default, and English when prop changes.
- Integration test in `src/__tests__/App.test.tsx` — extend to verify locale toggle changes visible text.

## Out of scope

- Auto-detection from `navigator.language`.
- More than two locales.
- RTL languages.
- Per-locale date or number formatting (puzzle date is `YYYY-MM-DD`, identical across locales).
- Localized error/console messages.
