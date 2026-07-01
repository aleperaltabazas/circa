import { describe, it, expect } from "vitest";
import puzzlesData from "../puzzles.json5";
import { Puzzle, isPointAnswer } from "../../game/types";
import { LOCALES } from "../../i18n/types";
import { eraRange } from "../../game/eras";
import { answerRange } from "../../game/scoring";
import { currentYearArt } from "../../game/today";

const puzzles = puzzlesData as Puzzle[];

describe("puzzles.json", () => {
  it("contains at least one puzzle", () => {
    expect(puzzles.length).toBeGreaterThan(0);
  });

  it("every puzzle has a unique id", () => {
    const ids = puzzles.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every puzzle has hints for every locale with exactly 5 strings", () => {
    for (const p of puzzles) {
      for (const loc of LOCALES) {
        const hints = p.hints?.[loc];
        expect(hints, `${p.id} missing locale ${loc}`).toBeDefined();
        expect(hints, `${p.id}[${loc}] not an array`).toBeInstanceOf(Array);
        expect(hints, `${p.id}[${loc}] does not have 5 hints`).toHaveLength(5);
        for (let i = 0; i < 5; i++) {
          expect(typeof hints[i], `${p.id}[${loc}][${i}] not a string`).toBe("string");
          expect(hints[i].length, `${p.id}[${loc}][${i}] is empty`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("SpanAnswer puzzles have from <= to", () => {
    for (const p of puzzles) {
      if (!isPointAnswer(p.answer)) {
        expect(p.answer.from, `${p.id} has from > to`).toBeLessThanOrEqual(p.answer.to);
      }
    }
  });

  it("PointAnswer puzzles have a valid margin (0–0.2 if present)", () => {
    for (const p of puzzles) {
      if (isPointAnswer(p.answer) && p.answer.margin !== undefined) {
        expect(typeof p.answer.margin, `${p.id} margin is not a number`).toBe("number");
        expect(p.answer.margin, `${p.id} margin out of range`).toBeGreaterThanOrEqual(0);
        expect(p.answer.margin, `${p.id} margin out of range`).toBeLessThanOrEqual(0.2);
      }
    }
  });

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

  it("dateAnchored, when present, is a boolean", () => {
    for (const p of puzzles) {
      if ("dateAnchored" in p && p.dateAnchored !== undefined) {
        expect(typeof p.dateAnchored, `${p.id} dateAnchored is not a boolean`).toBe("boolean");
      }
    }
  });

  it("every puzzle has a valid par", () => {
    for (const p of puzzles) {
      expect(typeof p.par, `${p.id} par is not a number`).toBe("number");
      expect(Number.isInteger(p.par), `${p.id} par is not an integer`).toBe(true);
      expect(p.par, `${p.id} par out of range`).toBeGreaterThanOrEqual(1);
      expect(p.par, `${p.id} par out of range`).toBeLessThanOrEqual(5);
    }
  });

  it("every puzzle's answer falls within its era", () => {
    const currentYear = currentYearArt();
    for (const p of puzzles) {
      const { from: eraFrom, to: eraTo } = eraRange(p.era, currentYear);
      const range = answerRange(p.answer, p.era, currentYear);
      expect(range.from, `${p.id} range.from ${range.from} outside era ${p.era} [${eraFrom}, ${eraTo})`).toBeGreaterThanOrEqual(eraFrom);
      expect(range.from, `${p.id} range.from ${range.from} outside era ${p.era} [${eraFrom}, ${eraTo})`).toBeLessThan(eraTo);
      expect(range.to, `${p.id} range.to ${range.to} outside era ${p.era} [${eraFrom}, ${eraTo})`).toBeGreaterThanOrEqual(eraFrom);
      expect(range.to, `${p.id} range.to ${range.to} outside era ${p.era} [${eraFrom}, ${eraTo})`).toBeLessThan(eraTo);
    }
  });
});
