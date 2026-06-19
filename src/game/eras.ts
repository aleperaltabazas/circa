import { Era } from "./types";

const TABLE: Record<Era, { from: number; to: number | "currentYearInclusive" }> = {
  prehistory: { from: -3000, to: -753 },
  ancient: { from: -753, to: 476 },
  medieval: { from: 476, to: 1453 },
  modern: { from: 1453, to: 1789 },
  recent: { from: 1789, to: "currentYearInclusive" },
};

export function eraRange(era: Era, currentYear: number): { from: number; to: number; width: number } {
  const entry = TABLE[era];
  const to = entry.to === "currentYearInclusive" ? currentYear + 1 : entry.to;
  return { from: entry.from, to, width: to - entry.from };
}
