import { noCase } from "change-case";
import TypeIcon from "./TypeIcon";
import styles from "./elements.module.css";
import { getURIFragment } from "@/utils";

export interface ConnectedAssetDetailsProps {
  /** Connected asset error, if any */
  error?: Error;
  /** Asset URI */
  uri: string;
  /** Canonical asset name */
  name: string;
  /** Asset type */
  type: string;
  /** Asset criticality */
  criticality?: number;
  /** Connection strength, which is apparently different from criticality */
  connectionStrength?: number;
  /** Whether the connection is added(?) */
  isAdded: boolean;
}

export default function ConnectedAssetDetails({
  error,
  uri,
  name,
  type,
  criticality,
  connectionStrength,
  isAdded,
}: ConnectedAssetDetailsProps) {
  if (error) {
    return <li className={styles.errorMessage}>{error.message}</li>;
  }

  return (
    <li className={styles.connectedAssetDetails}>
      <div className={styles.connectedAssetHeader}>
        <TypeIcon size="sm" type={type} disabled={!isAdded} />
        <div>
          <h4>{name || uri}</h4>
          <p className={styles.connectedAssetType}>
            {noCase(getURIFragment(type))}
          </p>
          <p className={styles.connectedAssetUri}>{uri.split("#")[1]}</p>
        </div>
      </div>
      <p className={styles.connectedAssetInfo}>
        Criticality: {criticality || "N/D"}
      </p>
      <p className={styles.connectedAssetInfo}>
        Connection Strength: {connectionStrength || "N/D"}
      </p>
    </li>
  );
}
