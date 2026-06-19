import { Era } from "../game/types";
import styles from "./EraPill.module.css";

export function EraPill({ era }: { era: Era }) {
  return <span className={styles.pill}>{era}</span>;
}
