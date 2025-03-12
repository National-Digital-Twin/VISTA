import styles from "./chart.module.css";

export interface SummaryInfoProps {
  /** Name we are summarising */
  readonly name: string;
  /** Parameter which is being plotted */
  readonly parameter: string;
  /** Internal name of the parameter */
  readonly param: string;
  /** Latest measured value */
  readonly latestValue: number;
  /** RLOI ID */
  readonly RLOIid: number;
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
        {/* Actually fetch RLOI ID */}
        RLOI ID: <strong>{RLOIid}</strong>
      </div>
    </div>
  );
}
