import { describe, it, expect } from "vitest";
import { formatAnswer } from "../answer";

describe("formatAnswer", () => {
  it("renders a PointAnswer as a single number", () => {
    expect(formatAnswer({ year: 1571 })).toBe("1571");
  });

  it("renders a PointAnswer with margin as a single number (no range shown)", () => {
    expect(formatAnswer({ year: 1520, margin: 2 })).toBe("1520");
  });

  it("renders a SpanAnswer with an en-dash", () => {
    expect(formatAnswer({ from: 1789, to: 1799 })).toBe("1789–1799");
  });

  it("renders a BCE PointAnswer as a single negative number", () => {
    expect(formatAnswer({ year: -1000 })).toBe("-1000");
  });

  it("renders a BCE-CE SpanAnswer with an en-dash", () => {
    expect(formatAnswer({ from: -10, to: 10 })).toBe("-10–10");
  });
});
