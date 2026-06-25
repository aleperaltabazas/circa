import { describe, it, expect } from "vitest";
import { colorFor } from "../color";

describe("colorFor", () => {
  it("returns deep emerald for a perfect guess", () => {
    expect(colorFor({ year: 1571, distanceRatio: 0, bucket: "perfect", direction: "match" })).toBe(
      "#15803d",
    );
  });

  it("returns green for a close guess", () => {
    expect(colorFor({ year: 1574, distanceRatio: 0.009, bucket: "close", direction: "later" })).toBe(
      "#22c55e",
    );
  });

  it("returns yellow for a mid guess", () => {
    expect(colorFor({ year: 1600, distanceRatio: 0.086, bucket: "mid", direction: "earlier" })).toBe(
      "#eab308",
    );
  });

  it("returns red for a far guess", () => {
    expect(colorFor({ year: 1700, distanceRatio: 1, bucket: "far", direction: "earlier" })).toBe(
      "#ef4444",
    );
  });
});
