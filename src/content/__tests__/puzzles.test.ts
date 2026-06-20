import { describe, it, expect } from "vitest";
import puzzlesData from "../puzzles.json";
import { Puzzle } from "../../game/types";
import { LOCALES } from "../../i18n/types";

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
});
