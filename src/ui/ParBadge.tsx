import { Par } from "../game/types";
import styles from "./ParBadge.module.css";

const LABELS: Record<Par, string> = {
  1: "muy fácil (1 pista)",
  2: "fácil (2 pistas)",
  3: "media (3 pistas)",
  4: "difícil (4 pistas)",
  5: "muy difícil (5 pistas)",
};

export function ParBadge({ par }: { par: Par }) {
  return (
    <span className={styles.badge} data-par={par}>
      Dificultad: {LABELS[par]}
    </span>
  );
}
