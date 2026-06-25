import { describe, it, expect } from "vitest";
import { scoreGuess } from "../scoring";

const exact = (year: number) => ({ from: year, to: year });

describe("scoreGuess (exact-year puzzles, from === to)", () => {
  it("returns perfect for an exact match", () => {
    expect(scoreGuess(1571, exact(1571), "modern", 2026)).toEqual({
      distanceRatio: 0,
      bucket: "perfect",
      direction: "match",
    });
  });

  it("computes distanceRatio as d/W in modern era", () => {
    const result = scoreGuess(1500, exact(1571), "modern", 2026);
    expect(result.distanceRatio).toBeCloseTo(71 / 336, 5);
  });

  it("caps distanceRatio at 1 and uses 'far' bucket", () => {
    const result = scoreGuess(1453, exact(2026), "recent", 2026);
    expect(result.distanceRatio).toBe(1);
    expect(result.bucket).toBe("far");
  });

  it("returns 'close' when within 5% of era width", () => {
    // d=3, W=336 → 0.009 ≤ 0.05
    expect(scoreGuess(1574, exact(1571), "modern", 2026).bucket).toBe("close");
    // d=16, W=336 → 0.0476 ≤ 0.05
    expect(scoreGuess(1587, exact(1571), "modern", 2026).bucket).toBe("close");
  });

  it("returns 'mid' when within 25% of era width but beyond close", () => {
    // d=29, W=336 → 0.086 — > 0.05, ≤ 0.25
    expect(scoreGuess(1600, exact(1571), "modern", 2026).bucket).toBe("mid");
    // d=80, W=336 → 0.238 ≤ 0.25
    expect(scoreGuess(1651, exact(1571), "modern", 2026).bucket).toBe("mid");
  });

  it("returns 'far' beyond 25% of era width", () => {
    // d=200, W=336 → 0.595 > 0.25
    expect(scoreGuess(1500, exact(1700), "modern", 2026).bucket).toBe("far");
  });

  it("handles BCE answers", () => {
    expect(scoreGuess(-1000, exact(-1000), "ancient", 2026)).toEqual({
      distanceRatio: 0,
      bucket: "perfect",
      direction: "match",
    });
  });

  it("computes distance correctly across BCE/CE boundary", () => {
    const result = scoreGuess(-10, exact(10), "ancient", 2026);
    expect(result.distanceRatio).toBeCloseTo(20 / 1229, 5);
  });
});

describe("scoreGuess (range puzzles, from < to)", () => {
  it("returns perfect for a guess at the lower bound", () => {
    expect(scoreGuess(1789, { from: 1789, to: 1799 }, "recent", 2026)).toEqual({
      distanceRatio: 0,
      bucket: "perfect",
      direction: "match",
    });
  });

  it("returns perfect for a guess at the upper bound", () => {
    expect(scoreGuess(1799, { from: 1789, to: 1799 }, "recent", 2026)).toEqual({
      distanceRatio: 0,
      bucket: "perfect",
      direction: "match",
    });
  });

  it("returns perfect for a guess inside the range", () => {
    expect(scoreGuess(1793, { from: 1789, to: 1799 }, "recent", 2026)).toEqual({
      distanceRatio: 0,
      bucket: "perfect",
      direction: "match",
    });
  });

  it("uses distance to nearest edge when guess is below the range", () => {
    const result = scoreGuess(1780, { from: 1789, to: 1799 }, "recent", 2026);
    expect(result.distanceRatio).toBeCloseTo(9 / 238, 5);
  });

  it("uses distance to nearest edge when guess is above the range", () => {
    const result = scoreGuess(1810, { from: 1789, to: 1799 }, "recent", 2026);
    expect(result.distanceRatio).toBeCloseTo(11 / 238, 5);
  });
});

describe("scoreGuess direction", () => {
  const exact = (year: number) => ({ from: year, to: year });

  it("returns match for an exact-year hit", () => {
    expect(scoreGuess(1571, exact(1571), "modern", 2026).direction).toBe("match");
  });

  it("returns later when guess is before an exact answer", () => {
    expect(scoreGuess(1500, exact(1571), "modern", 2026).direction).toBe("later");
  });

  it("returns earlier when guess is after an exact answer", () => {
    expect(scoreGuess(1600, exact(1571), "modern", 2026).direction).toBe("earlier");
  });

  it("returns match for any guess inside a range answer", () => {
    expect(scoreGuess(1793, { from: 1789, to: 1799 }, "recent", 2026).direction).toBe("match");
    expect(scoreGuess(1789, { from: 1789, to: 1799 }, "recent", 2026).direction).toBe("match");
    expect(scoreGuess(1799, { from: 1789, to: 1799 }, "recent", 2026).direction).toBe("match");
  });

  it("returns later when guess is below a range answer", () => {
    expect(scoreGuess(1780, { from: 1789, to: 1799 }, "recent", 2026).direction).toBe("later");
  });

  it("returns earlier when guess is above a range answer", () => {
    expect(scoreGuess(1810, { from: 1789, to: 1799 }, "recent", 2026).direction).toBe("earlier");
  });

  it("handles BCE direction correctly", () => {
    expect(scoreGuess(-2000, exact(-1000), "ancient", 2026).direction).toBe("later");
    expect(scoreGuess(0, exact(-1000), "ancient", 2026).direction).toBe("earlier");
  });
});
