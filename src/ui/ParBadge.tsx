import { Par } from "../game/types";
import styles from "./ParBadge.module.css";

const LABELS: Record<Par, string> = {
  1: "muy fácil",
  2: "fácil",
  3: "media",
  4: "difícil",
  5: "muy difícil",
};

export function ParBadge({ par }: { par: Par }) {
  return <span className={styles.badge} data-par={par}>Dificultad: {LABELS[par]}</span>;
}
