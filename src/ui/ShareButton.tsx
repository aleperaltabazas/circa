import { useState } from "react";
import { GameState } from "../game/types";
import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import { formatShare } from "../share/formatShare";
import styles from "./ShareButton.module.css";

export function ShareButton({
  state,
  puzzleNumber,
  url,
  locale,
}: {
  state: GameState;
  puzzleNumber: number;
  url: string;
  locale: Locale;
}) {
  const [copied, setCopied] = useState(false);
  const s = STRINGS[locale];

  async function handleClick() {
    await navigator.clipboard.writeText(formatShare(state, puzzleNumber, url, locale));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button className={styles.btn} type="button" onClick={handleClick}>
      {copied ? s.copied : s.share}
    </button>
  );
}
