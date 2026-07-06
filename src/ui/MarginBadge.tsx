import { Answer, Era, isPointAnswer } from "../game/types";
import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import { eraRange } from "../game/eras";
import styles from "./MarginBadge.module.css";
import tooltipCss from "./Tooltip.module.css";

function deriveLabel(answer: Answer, locale: Locale): string | null {
  if (!isPointAnswer(answer) || !answer.margin) return null;
  const ml = STRINGS[locale].marginLabel;
  if (typeof answer.margin === "string") return ml[answer.margin];
  return ml.percent(Math.round(answer.margin * 100));
}

function deriveTooltip(answer: Answer, locale: Locale, era?: Era, currentYear?: number): string | null {
  if (!isPointAnswer(answer) || !answer.margin) return null;
  const mt = STRINGS[locale].marginTooltip;
  if (typeof answer.margin === "string") return mt[answer.margin];
  const pct = Math.round(answer.margin * 100);
  if (era !== undefined && currentYear !== undefined) {
    const { width } = eraRange(era, currentYear);
    const years = Math.round(answer.margin * width);
    return mt.percent(pct, years);
  }
  return mt.percent(pct);
}

export function MarginBadge({ answer, locale, era, currentYear }: {
  answer: Answer;
  locale: Locale;
  era?: Era;
  currentYear?: number;
}) {
  const label = deriveLabel(answer, locale);
  if (!label) return null;
  const tip = deriveTooltip(answer, locale, era, currentYear);
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
