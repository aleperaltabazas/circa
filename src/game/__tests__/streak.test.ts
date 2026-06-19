import { describe, it, expect } from "vitest";
import { applyResult } from "../streak";

describe("applyResult", () => {
  it("starts a streak at 1 on first win", () => {
    expect(applyResult({ currentStreak: 0, maxStreak: 0, lastWinDate: null }, "won", "2026-06-19"))
      .toEqual({ currentStreak: 1, maxStreak: 1, lastWinDate: "2026-06-19" });
  });

  it("extends the streak when lastWinDate is yesterday", () => {
    expect(applyResult({ currentStreak: 4, maxStreak: 4, lastWinDate: "2026-06-18" }, "won", "2026-06-19"))
      .toEqual({ currentStreak: 5, maxStreak: 5, lastWinDate: "2026-06-19" });
  });

  it("resets to 1 when there is a gap day", () => {
    expect(applyResult({ currentStreak: 4, maxStreak: 6, lastWinDate: "2026-06-17" }, "won", "2026-06-19"))
      .toEqual({ currentStreak: 1, maxStreak: 6, lastWinDate: "2026-06-19" });
  });

  it("keeps maxStreak as the previous max if not exceeded", () => {
    expect(applyResult({ currentStreak: 2, maxStreak: 10, lastWinDate: "2026-06-18" }, "won", "2026-06-19"))
      .toEqual({ currentStreak: 3, maxStreak: 10, lastWinDate: "2026-06-19" });
  });

  it("resets currentStreak to 0 on a loss and keeps lastWinDate/maxStreak", () => {
    expect(applyResult({ currentStreak: 4, maxStreak: 6, lastWinDate: "2026-06-18" }, "lost", "2026-06-19"))
      .toEqual({ currentStreak: 0, maxStreak: 6, lastWinDate: "2026-06-18" });
  });
});
