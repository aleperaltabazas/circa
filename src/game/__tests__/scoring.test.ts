import { describe, it, expect } from "vitest";
import { scoreGuess, answerRange } from "../scoring";

const point = (year: number) => ({ year });
const margin = (year: number, m: number) => ({ year, margin: m });
const span = (from: number, to: number) => ({ from, to });

describe("scoreGuess (PointAnswer, no margin)", () => {
  it("returns perfect for an exact match", () => {
    expect(scoreGuess(1571, point(1571), "modern", 2026)).toEqual({
      distanceRatio: 0,
      bucket: "perfect",
      direction: "match",
    });
  });

  it("computes distanceRatio as d/W in modern era", () => {
    const result = scoreGuess(1500, point(1571), "modern", 2026);
    expect(result.distanceRatio).toBeCloseTo(71 / 336, 5);
  });

  it("caps distanceRatio at 1 and uses 'far' bucket", () => {
    const result = scoreGuess(1453, point(2026), "recent", 2026);
    expect(result.distanceRatio).toBe(1);
    expect(result.bucket).toBe("far");
  });

  it("returns 'close' when within 5% of era width", () => {
    expect(scoreGuess(1574, point(1571), "modern", 2026).bucket).toBe("close");
    expect(scoreGuess(1587, point(1571), "modern", 2026).bucket).toBe("close");
  });

  it("returns 'mid' when within 25% of era width but beyond close", () => {
    expect(scoreGuess(1600, point(1571), "modern", 2026).bucket).toBe("mid");
    expect(scoreGuess(1651, point(1571), "modern", 2026).bucket).toBe("mid");
  });

  it("returns 'far' beyond 25% of era width", () => {
    expect(scoreGuess(1500, point(1700), "modern", 2026).bucket).toBe("far");
  });

  it("handles BCE answers", () => {
    expect(scoreGuess(-1000, point(-1000), "ancient", 2026)).toEqual({
      distanceRatio: 0,
      bucket: "perfect",
      direction: "match",
    });
  });

  it("computes distance correctly across BCE/CE boundary", () => {
    const result = scoreGuess(-10, point(10), "ancient", 2026);
    expect(result.distanceRatio).toBeCloseTo(20 / 1229, 5);
  });
});

describe("scoreGuess (PointAnswer, with margin)", () => {
  // modern era width = 336; margin=0.02 → delta = floor(336*0.02) = 6 → range 1514–1526
  it("returns perfect for a guess at the canonical year", () => {
    expect(scoreGuess(1520, margin(1520, 0.02), "modern", 2026)).toEqual({
      distanceRatio: 0,
      bucket: "perfect",
      direction: "match",
    });
  });

  it("returns perfect for a guess inside the margin range", () => {
    expect(scoreGuess(1516, margin(1520, 0.02), "modern", 2026)).toEqual({
      distanceRatio: 0,
      bucket: "perfect",
      direction: "match",
    });
  });

  it("returns non-perfect for a guess just outside the margin range", () => {
    const result = scoreGuess(1513, margin(1520, 0.02), "modern", 2026);
    expect(result.bucket).not.toBe("perfect");
    expect(result.direction).toBe("later");
  });
});

describe("answerRange", () => {
  it("PointAnswer with no margin returns a single-year range", () => {
    expect(answerRange(point(1571), "modern", 2026)).toEqual({ from: 1571, to: 1571 });
  });

  it("PointAnswer with margin=0.02 in modern era (W=336) returns ±6 year range", () => {
    expect(answerRange(margin(1520, 0.02), "modern", 2026)).toEqual({ from: 1514, to: 1526 });
  });

  it("SpanAnswer is returned as-is", () => {
    expect(answerRange(span(400, 420), "ancient", 2026)).toEqual({ from: 400, to: 420 });
  });
});

describe("scoreGuess (SpanAnswer)", () => {
  it("returns perfect for a guess at the lower bound", () => {
    expect(scoreGuess(1789, span(1789, 1799), "recent", 2026)).toEqual({
      distanceRatio: 0,
      bucket: "perfect",
      direction: "match",
    });
  });

  it("returns perfect for a guess at the upper bound", () => {
    expect(scoreGuess(1799, span(1789, 1799), "recent", 2026)).toEqual({
      distanceRatio: 0,
      bucket: "perfect",
      direction: "match",
    });
  });

  it("returns perfect for a guess inside the range", () => {
    expect(scoreGuess(1793, span(1789, 1799), "recent", 2026)).toEqual({
      distanceRatio: 0,
      bucket: "perfect",
      direction: "match",
    });
  });

  it("uses distance to nearest edge when guess is below the range", () => {
    const result = scoreGuess(1780, span(1789, 1799), "recent", 2026);
    expect(result.distanceRatio).toBeCloseTo(9 / 238, 5);
  });

  it("uses distance to nearest edge when guess is above the range", () => {
    const result = scoreGuess(1810, span(1789, 1799), "recent", 2026);
    expect(result.distanceRatio).toBeCloseTo(11 / 238, 5);
  });
});

describe("scoreGuess direction", () => {
  it("returns match for an exact-year hit", () => {
    expect(scoreGuess(1571, point(1571), "modern", 2026).direction).toBe("match");
  });

  it("returns later when guess is before an exact answer", () => {
    expect(scoreGuess(1500, point(1571), "modern", 2026).direction).toBe("later");
  });

  it("returns earlier when guess is after an exact answer", () => {
    expect(scoreGuess(1600, point(1571), "modern", 2026).direction).toBe("earlier");
  });

  it("returns match for any guess inside a SpanAnswer", () => {
    expect(scoreGuess(1793, span(1789, 1799), "recent", 2026).direction).toBe("match");
    expect(scoreGuess(1789, span(1789, 1799), "recent", 2026).direction).toBe("match");
    expect(scoreGuess(1799, span(1789, 1799), "recent", 2026).direction).toBe("match");
  });

  it("returns later when guess is below a SpanAnswer", () => {
    expect(scoreGuess(1780, span(1789, 1799), "recent", 2026).direction).toBe("later");
  });

  it("returns earlier when guess is above a SpanAnswer", () => {
    expect(scoreGuess(1810, span(1789, 1799), "recent", 2026).direction).toBe("earlier");
  });

  it("handles BCE direction correctly", () => {
    expect(scoreGuess(-2000, point(-1000), "ancient", 2026).direction).toBe("later");
    expect(scoreGuess(0, point(-1000), "ancient", 2026).direction).toBe("earlier");
  });
});
