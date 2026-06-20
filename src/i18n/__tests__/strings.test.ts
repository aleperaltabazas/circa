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

  it("renders parameterized strings without leaking placeholders", () => {
    for (const loc of LOCALES) {
      const s = STRINGS[loc];
      expect(s.rangeHint(1453, 1788)).toMatch(/1453/);
      expect(s.rangeHint(1453, 1788)).toMatch(/1788/);
      expect(s.puzzleMeta(42, "2026-06-20")).toMatch(/42/);
      expect(s.outcomeWin(3)).toMatch(/3/);
      expect(s.outcomeLoss(1571)).toMatch(/1571/);
      expect(s.shareTail("https://x.test/")).toMatch(/https:\/\/x\.test\//);
    }
  });
});
