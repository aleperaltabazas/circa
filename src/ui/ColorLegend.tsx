import styles from "./ColorLegend.module.css";

export function ColorLegend() {
  return (
    <div>
      <div className={styles.bar} />
      <div className={styles.labels}>
        <span>far off</span>
        <span>closer</span>
        <span>exact</span>
      </div>
    </div>
  );
}
