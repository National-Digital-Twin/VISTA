import styles from "./chart.module.css";

export interface SummaryInfoProps {
  /** Name we are summarising */
  name: string;
  /** Parameter which is being plotted */
  parameter: string;
  /** Internal name of the parameter */
  param: string;
  /** Latest measured value */
  latestValue: number;
  /** RLOI ID */
  RLOIid: number;
}

export default function SummaryInfo({
  name,
  parameter,
  param,
  latestValue,
  RLOIid,
}: SummaryInfoProps) {
  return (
    <div className={styles.summaryInfo}>
      <div className={styles.summaryInfoItem}>
        <strong>{name}</strong>
      </div>
      <div className={styles.summaryInfoItem}>
        Parameter: <strong>{parameter}</strong>
      </div>
      <div className={styles.summaryInfoItem}>
        Latest {param}: <strong>{latestValue}m</strong>
      </div>
      <div className={styles.summaryInfoItem}>
        {/* TODO: Actually fetch RLOI ID */}
        RLOI ID: <strong>{RLOIid}</strong>
      </div>
    </div>
  );
}
