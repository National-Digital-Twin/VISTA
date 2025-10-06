import { capitalCase } from 'change-case';
import TypeIcon from './TypeIcon';
import styles from './elements.module.css';
import { getURIFragment } from '@/utils';

export interface ConnectedAssetDetailsProps {
    /** Connected asset error, if any */
    readonly error?: Error;
    /** Asset URI */
    readonly uri: string;
    /** Canonical asset name */
    readonly name: string;
    /** Asset type */
    readonly type: string;
    /** Asset criticality */
    readonly criticality?: number;
    /** Connection strength, which is apparently different from criticality */
    readonly connectionStrength?: number;
}

export default function ConnectedAssetDetails({ error, uri, name, type, criticality, connectionStrength }: ConnectedAssetDetailsProps) {
    if (error) {
        return <li className={styles.errorMessage}>{error.message}</li>;
    }

    return (
        <li className={styles.connectedAssetDetails}>
            <div className={styles.connectedAssetHeader}>
                <TypeIcon size="sm" type={type} />
                <div>
                    <h4>{name || uri}</h4>
                    <p className={styles.connectedAssetType}>{capitalCase(getURIFragment(type))}</p>
                    <p className={styles.connectedAssetUri}>{uri.split('#')[1]}</p>
                </div>
            </div>
            <p className={styles.connectedAssetInfo}>Criticality: {criticality ?? 'N/D'}</p>
            <p className={styles.connectedAssetInfo}>Connection Strength: {connectionStrength ?? 'N/D'}</p>
        </li>
    );
}
