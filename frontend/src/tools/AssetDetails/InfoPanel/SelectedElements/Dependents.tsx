import ConnectedAssets from './ConnectedAssets';
import styles from './elements.module.css';
import { isEmpty } from '@/utils/isEmpty';
import { useDependents } from '@/hooks';

export interface DependentsProps {
    /** Asset URI */
    readonly assetUri: string;
    /** Dependent asset */
    readonly dependent: any;
    /** Is it an asset? */
    readonly isAsset: boolean;
    /** Is it a dependency? */
    readonly isDependency: boolean;
}

export default function Dependents({ assetUri, dependent, isAsset, isDependency }: DependentsProps) {
    const { isLoading, isError, error, data: dependents } = useDependents(isAsset, isDependency, assetUri, dependent);

    if (isLoading) {
        return <p className={styles.loadingMessage}>Loading dependent assets</p>;
    }
    if (isError) {
        return <p className={styles.errorMessage}>{error?.message}</p>;
    }
    if (isEmpty(dependents)) {
        return null;
    }

    return <ConnectedAssets connectedAssets={dependents} />;
}
