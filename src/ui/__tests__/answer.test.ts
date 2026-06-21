import { describe, it, expect } from "vitest";
import { formatAnswer } from "../answer";

describe("formatAnswer", () => {
  it("renders an exact-year answer as a single number", () => {
    expect(formatAnswer({ from: 1571, to: 1571 })).toBe("1571");
  });

  it("renders a range with an en-dash", () => {
    expect(formatAnswer({ from: 1789, to: 1799 })).toBe("1789–1799");
  });

  it("renders BCE exact-year as a single negative number", () => {
    expect(formatAnswer({ from: -1000, to: -1000 })).toBe("-1000");
  });

  it("renders a BCE-CE crossing range with an en-dash", () => {
    expect(formatAnswer({ from: -10, to: 10 })).toBe("-10–10");
  });
});
