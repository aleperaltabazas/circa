import { describe, it, expect } from "vitest";
import { STRINGS } from "../strings";
import { LOCALES } from "../types";

describe("STRINGS", () => {
  it("has the same top-level keys for every locale", () => {
    const ref = Object.keys(STRINGS[LOCALES[0]]).sort();
    for (const loc of LOCALES) {
      expect(Object.keys(STRINGS[loc]).sort(), `${loc} keys differ from ${LOCALES[0]}`).toEqual(ref);
    }
  });

  it("has the same era labels for every locale", () => {
    const ref = Object.keys(STRINGS[LOCALES[0]].eraLabel).sort();
    for (const loc of LOCALES) {
      expect(Object.keys(STRINGS[loc].eraLabel).sort()).toEqual(ref);
    }
  });

  it("has directionLabel for every direction in every locale", () => {
    const refDirs = Object.keys(STRINGS[LOCALES[0]].directionLabel).sort();
    expect(refDirs).toEqual(["earlier", "later", "match"]);
    for (const loc of LOCALES) {
      expect(Object.keys(STRINGS[loc].directionLabel).sort()).toEqual(refDirs);
    }
  });

  it("guessAria interpolates both year and direction label", () => {
    for (const loc of LOCALES) {
      const s = STRINGS[loc];
      const aria = s.guessAria(1571, s.directionLabel.earlier);
      expect(aria).toMatch(/1571/);
      expect(aria).toMatch(new RegExp(s.directionLabel.earlier));
    }
  });

  it("has triviaTitle for every locale", () => {
    for (const loc of LOCALES) {
      expect(typeof STRINGS[loc].triviaTitle).toBe("string");
      expect(STRINGS[loc].triviaTitle.length).toBeGreaterThan(0);
    }
  });

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
});
