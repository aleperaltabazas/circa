import { describe, it, expect } from "vitest";
import puzzlesData from "../puzzles.json5";
import { Puzzle } from "../../game/types";
import { LOCALES } from "../../i18n/types";
import { eraRange } from "../../game/eras";
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

  it("every puzzle has answer.from <= answer.to", () => {
    for (const p of puzzles) {
      expect(p.answer.from, `${p.id} has from > to`).toBeLessThanOrEqual(p.answer.to);
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

  it("every puzzle's answer falls within its era", () => {
    const year = currentYearArt();
    for (const p of puzzles) {
      const { from, to } = eraRange(p.era, year);
      expect(p.answer.from, `${p.id} answer.from ${p.answer.from} outside era ${p.era} [${from}, ${to})`).toBeGreaterThanOrEqual(from);
      expect(p.answer.from, `${p.id} answer.from ${p.answer.from} outside era ${p.era} [${from}, ${to})`).toBeLessThan(to);
      expect(p.answer.to, `${p.id} answer.to ${p.answer.to} outside era ${p.era} [${from}, ${to})`).toBeGreaterThanOrEqual(from);
      expect(p.answer.to, `${p.id} answer.to ${p.answer.to} outside era ${p.era} [${from}, ${to})`).toBeLessThan(to);
    }
  });
});
