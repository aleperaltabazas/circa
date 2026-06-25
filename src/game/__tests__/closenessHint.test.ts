import { describe, it, expect } from "vitest";
import { closenessHintKey } from "../closenessHint";

const W = 100;

describe("closenessHintKey", () => {
  it("returns soClose when d/W < 3%", () => {
    expect(closenessHintKey(2, null, W)).toBe("soClose");
    expect(closenessHintKey(2, 5, W)).toBe("soClose");
    expect(closenessHintKey(2, 1, W)).toBe("soClose"); // override even if got farther
  });

  it("returns absolute bucket on first guess (prevD null)", () => {
    expect(closenessHintKey(3, null, W)).toBe("veryClose"); // 3% — at/above 3% boundary
    expect(closenessHintKey(5, null, W)).toBe("veryClose");
    expect(closenessHintKey(20, null, W)).toBe("close");
    expect(closenessHintKey(30, null, W)).toBe("tooFar");
  });

  it("returns closer when d < prevD (trend)", () => {
    expect(closenessHintKey(20, 30, W)).toBe("closer");
  });

  it("returns wentTooFar when d > prevD (trend)", () => {
    expect(closenessHintKey(30, 20, W)).toBe("wentTooFar");
  });

  it("falls back to absolute bucket when d === prevD (same distance)", () => {
    expect(closenessHintKey(20, 20, W)).toBe("close");
    expect(closenessHintKey(50, 50, W)).toBe("tooFar");
    expect(closenessHintKey(4, 4, W)).toBe("veryClose");
  });

  it("never returns 'same'", () => {
    // 'same' is intentionally dropped from the type — same-distance falls through to absolute bucket.
    expect(closenessHintKey(15, 15, W)).toBe("close");
  });

  it("soClose wins even when also matching close trend or buckets", () => {
    // d=2 would be veryClose by bucket, closer by trend — but soClose overrides both
    expect(closenessHintKey(2, 50, W)).toBe("soClose");
  });
});
