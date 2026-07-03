import { Answer, isPointAnswer } from "../game/types";
import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import styles from "./MarginBadge.module.css";

function deriveLabel(answer: Answer, locale: Locale): string | null {
  if (!isPointAnswer(answer) || !answer.margin) return null;
  const ml = STRINGS[locale].marginLabel;
  if (typeof answer.margin === "string") return ml[answer.margin];
  return ml.percent(Math.round(answer.margin * 100));
}

export function MarginBadge({ answer, locale }: { answer: Answer; locale: Locale }) {
  const label = deriveLabel(answer, locale);
  if (!label) return null;
  return <span className={styles.badge}>{label}</span>;
}
