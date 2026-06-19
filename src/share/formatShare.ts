import { Bucket, GameState } from "../game/types";

const EMOJI: Record<Bucket, string> = {
  perfect: "🟡",
  green: "🟢",
  lime: "🟩",
  yellow: "🟨",
  orange: "🟧",
  red: "🟥",
};

export function formatShare(state: GameState, puzzleNumber: number, url: string): string {
  const score = state.outcome === "won" ? `${state.guesses.length}/5` : "X/5";
  const row = state.guesses.map((g) => EMOJI[g.bucket]).join("");
  return `Circa #${puzzleNumber} — ${score} ${row}\nplay at ${url}`;
}
