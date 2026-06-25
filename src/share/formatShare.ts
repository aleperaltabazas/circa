import { Bucket, GameState } from "../game/types";
import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";

const EMOJI: Record<Bucket, string> = {
  perfect: "✅",
  close: "🟩",
  mid: "🟨",
  far: "🟥",
};

export function formatShare(
  state: GameState,
  puzzleNumber: number,
  url: string,
  locale: Locale,
): string {
  const score = state.outcome === "won" ? `${state.guesses.length}/5` : "X/5";
  const row = state.guesses.map((g) => EMOJI[g.bucket]).join("");
  return `Circa #${puzzleNumber} — ${score} ${row}\n${STRINGS[locale].shareTail(url)}`;
}
