import { describe, it, expect } from "vitest";
import { eraRange } from "../eras";

describe("eraRange", () => {
  it("returns the prehistory range", () => {
    expect(eraRange("prehistory", 2026)).toEqual({ from: -3000, to: -753, width: 2247 });
  });

  it("returns the ancient range", () => {
    expect(eraRange("ancient", 2026)).toEqual({ from: -753, to: 476, width: 1229 });
  });

  it("returns the medieval range", () => {
    expect(eraRange("medieval", 2026)).toEqual({ from: 476, to: 1453, width: 977 });
  });

  it("returns the modern range", () => {
    expect(eraRange("modern", 2026)).toEqual({ from: 1453, to: 1789, width: 336 });
  });

  it("returns the recent range up to currentYear+1", () => {
    expect(eraRange("recent", 2026)).toEqual({ from: 1789, to: 2027, width: 238 });
  });

  it("scales recent.to with currentYear", () => {
    expect(eraRange("recent", 2030)).toEqual({ from: 1789, to: 2031, width: 242 });
  });
});
