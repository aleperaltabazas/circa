import { describe, it, expect } from "vitest";
import { scoreGuess } from "../scoring";

describe("scoreGuess", () => {
  it("returns perfect for an exact match", () => {
    const result = scoreGuess(1571, 1571, "modern", 2026);
    expect(result).toEqual({ distanceRatio: 0, bucket: "perfect" });
  });

  it("computes distanceRatio as d/W in modern era", () => {
    const result = scoreGuess(1500, 1571, "modern", 2026);
    expect(result.distanceRatio).toBeCloseTo(71 / 336, 5);
  });

  it("caps distanceRatio at 1", () => {
    const result = scoreGuess(1453, 2026, "recent", 2026);
    expect(result.distanceRatio).toBe(1);
    expect(result.bucket).toBe("red");
  });

  it("returns green for d <= 0.01 * W", () => {
    const result = scoreGuess(1574, 1571, "modern", 2026);
    expect(result.bucket).toBe("green");
  });

  it("returns lime for 0.01W < d <= 0.05W", () => {
    const result = scoreGuess(1582, 1571, "modern", 2026);
    expect(result.bucket).toBe("lime");
  });

  it("returns yellow for 0.05W < d <= 0.15W", () => {
    const result = scoreGuess(1600, 1571, "modern", 2026);
    expect(result.bucket).toBe("yellow");
  });

  it("returns orange for 0.15W < d <= 0.40W", () => {
    const result = scoreGuess(1700, 1571, "modern", 2026);
    expect(result.bucket).toBe("orange");
  });

  it("returns red for d > 0.40W", () => {
    const result = scoreGuess(1500, 1700, "modern", 2026);
    expect(result.bucket).toBe("red");
  });

  it("handles negative-year answers (BCE)", () => {
    const result = scoreGuess(-1000, -1000, "ancient", 2026);
    expect(result).toEqual({ distanceRatio: 0, bucket: "perfect" });
  });

  it("computes distance correctly across BCE/CE boundary", () => {
    const result = scoreGuess(-10, 10, "ancient", 2026);
    expect(result.distanceRatio).toBeCloseTo(20 / 1229, 5);
  });
});
