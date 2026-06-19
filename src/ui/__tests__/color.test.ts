import { describe, it, expect } from "vitest";
import { colorFor } from "../color";

describe("colorFor", () => {
  it("returns gold for a perfect guess", () => {
    expect(colorFor({ year: 1571, distanceRatio: 0, bucket: "perfect" })).toBe("hsl(45, 90%, 55%)");
  });

  it("returns pure green at distanceRatio 0 (non-perfect)", () => {
    // ratio 0 but bucket green can happen only at d=0 which is "perfect", so this is theoretical;
    // we still want the formula to behave at the lerp endpoints.
    expect(colorFor({ year: 1571, distanceRatio: 0, bucket: "green" })).toBe("hsl(120, 65%, 50%)");
  });

  it("returns pure red at distanceRatio 1", () => {
    expect(colorFor({ year: 1700, distanceRatio: 1, bucket: "red" })).toBe("hsl(0, 65%, 50%)");
  });

  it("interpolates linearly at ratio 0.5", () => {
    expect(colorFor({ year: 1600, distanceRatio: 0.5, bucket: "yellow" })).toBe("hsl(60, 65%, 50%)");
  });
});
