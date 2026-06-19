import { useState } from "react";
import { GameState } from "../game/types";
import { formatShare } from "../share/formatShare";
import styles from "./ShareButton.module.css";

export function ShareButton({
  state,
  puzzleNumber,
  url,
}: {
  state: GameState;
  puzzleNumber: number;
  url: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    await navigator.clipboard.writeText(formatShare(state, puzzleNumber, url));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button className={styles.btn} type="button" onClick={handleClick}>
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
