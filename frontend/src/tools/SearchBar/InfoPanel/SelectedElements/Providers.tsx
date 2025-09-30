import ConnectedAssets from './ConnectedAssets';
import DetailsSection from './DetailsSection';
import styles from './elements.module.css';
import { isEmpty } from '@/utils/isEmpty';
import { useLocalStorage, useProviders } from '@/hooks';

export interface ProvidersProps {
    readonly isAsset: boolean;
    readonly isDependency: boolean;
    readonly assetUri: string;
    readonly provider: any;
}

export default function Providers({ isAsset, isDependency, assetUri, provider }: ProvidersProps) {
    const { isLoading, isError, error, data: providers } = useProviders(isAsset, isDependency, assetUri, provider);
    const [expand, setExpand] = useLocalStorage('showProviders', false);

    const totalProviders = providers?.length || 0;

    const handleToggleSection = () => {
        setExpand((prev) => !prev);
    };

    if (isLoading) {
        return <DetailsSection expand={false} title="Loading provider assets" />;
    }
    if (isError) {
        return <p className={styles.errorMessage}>{error.message}</p>;
    }
    if (isEmpty(providers)) {
        return null;
    }

    return (
        <DetailsSection expand={expand} onToggle={handleToggleSection} title={`${totalProviders} provider asset${totalProviders > 1 ? 's' : ''}`}>
            <div className={styles.sectionDescription}>Assets that provide access or resources to this asset.</div>
            <ConnectedAssets connectedAssets={providers} />
        </DetailsSection>
    );
}
