import { Answer, isPointAnswer } from "../game/types";
import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import styles from "./MarginBadge.module.css";
import tooltipCss from "./Tooltip.module.css";

function deriveLabel(answer: Answer, locale: Locale): string | null {
  if (!isPointAnswer(answer) || !answer.margin) return null;
  const ml = STRINGS[locale].marginLabel;
  if (typeof answer.margin === "string") return ml[answer.margin];
  return ml.percent(Math.round(answer.margin * 100));
}

function deriveTooltip(answer: Answer, locale: Locale): string | null {
  if (!isPointAnswer(answer) || !answer.margin) return null;
  const mt = STRINGS[locale].marginTooltip;
  if (typeof answer.margin === "string") return mt[answer.margin];
  return mt.percent(Math.round(answer.margin * 100));
}

export function MarginBadge({ answer, locale }: { answer: Answer; locale: Locale }) {
  const label = deriveLabel(answer, locale);
  if (!label) return null;
  const tip = deriveTooltip(answer, locale);
  return (
    <span
      className={`${styles.badge} ${tooltipCss.host}`}
      data-tooltip={tip ?? undefined}
      aria-label={tip ?? undefined}
      tabIndex={0}
    >
      {label}
    </span>
  );
}
