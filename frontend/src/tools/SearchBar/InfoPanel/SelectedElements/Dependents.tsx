import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import Button from '@mui/material/Button';
import ConnectedAssets from './ConnectedAssets';
import DetailsSection from './DetailsSection';
import styles from './elements.module.css';
import { isEmpty } from '@/utils/isEmpty';
import { useDependents, useGroupedAssets, useLocalStorage } from '@/hooks';

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

function filterDependentsForKnownAssetsOnly(dependents, dependentsAsAssets) {
    const uris = new Set(dependentsAsAssets.map((dependentAsAsset) => dependentAsAsset.uri));

    return dependents.filter((d) => uris.has(d.uri));
}

export default function Dependents({ assetUri, dependent, isAsset, isDependency }: DependentsProps) {
    const [expand, setExpand] = useLocalStorage('showDependents', false);
    const { isLoading, isError, error, data: dependents } = useDependents(isAsset, isDependency, assetUri, dependent);

    const handleToggleSection = () => {
        setExpand((prev) => !prev);
    };

    const { isLoadingDependencies, isDependenciesError, getDependentAssets } = useGroupedAssets({});
    const dependentsAsAssets = getDependentAssets([{ uri: assetUri }]);

    if (isLoading || isLoadingDependencies) {
        return <p className={styles.loadingMessage}>Loading dependent assets</p>;
    }
    if (isError || isDependenciesError) {
        return <p className={styles.errorMessage}>{error.message}</p>;
    }
    if (isEmpty(dependents) || isEmpty(dependentsAsAssets.dependentAssets)) {
        return null;
    }

    const filteredDependents = filterDependentsForKnownAssetsOnly(dependents, dependentsAsAssets.dependentAssets);
    const totalDependents = filteredDependents?.length || 0;

    const handleClick = () => {};

    return (
        <DetailsSection expand={expand} onToggle={handleToggleSection} title={`${totalDependents} dependent asset${totalDependents > 1 ? 's' : ''}`}>
            <div className={styles.sectionInfo}>
                <FontAwesomeIcon icon={faInfoCircle} className={styles.infoIcon} />
                <span>Dependent assets: Assets that rely on/ consume services from this asset.</span>
                <Button variant="contained" onClick={handleClick}>
                    Open Popover
                </Button>
            </div>
            <ConnectedAssets connectedAssets={filteredDependents} />
        </DetailsSection>
    );
}
