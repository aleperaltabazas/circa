import { Par } from "../game/types";
import styles from "./ParBadge.module.css";

export function ParBadge({ par }: { par: Par }) {
  return <span className={styles.badge}>Par {par}</span>;
}
