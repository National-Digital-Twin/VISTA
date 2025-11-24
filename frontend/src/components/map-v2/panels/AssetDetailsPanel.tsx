import { useQuery } from '@tanstack/react-query';
import { Box, CircularProgress, Alert, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { noCase } from 'change-case';
import StreetViewSection from './StreetViewSection';
import ConnectedAssetsSection from './ConnectedAssetsSection';
import { fetchAssetInfo } from '@/api/combined';
import { isAsset, getURIFragment } from '@/utils';
import { isEmpty } from '@/utils/isEmpty';
import { AssetState } from '@/models/Asset';
import type { Asset, Element } from '@/models';
import { useDependents, useProviders } from '@/hooks';

interface AssetDetailsPanelProps {
    readonly selectedElement: Element | null;
    readonly onBack: () => void;
}

const transformToConnectedAsset = (item: any) => {
    if (item?.error) {
        return {
            uri: '',
            error: item.error,
            name: '',
            assetType: '',
            dependentCriticalitySum: 0,
            connectionStrength: 0,
        };
    }
    return {
        uri: item?.uri || '',
        name: item?.name || '',
        assetType: item?.assetType || item?.type || '',
        dependentCriticalitySum: item?.dependentCriticalitySum || 0,
        connectionStrength: item?.connectionStrength || 0,
    };
};

const AssetDetailsPanel = ({ selectedElement, onBack }: AssetDetailsPanelProps) => {
    const elemIsAsset = isAsset(selectedElement ?? undefined);
    const elemIsStatic = elemIsAsset && (selectedElement as Asset)?.state === AssetState.Static;

    const assetInfo = useQuery({
        enabled: elemIsAsset && elemIsStatic && !!selectedElement?.uri,
        queryKey: ['asset-info', selectedElement?.uri || ''],
        queryFn: () => fetchAssetInfo(selectedElement?.uri || ''),
    });

    const {
        isLoading: isProvidersLoading,
        isError: isProvidersError,
        error: providersError,
        data: providers,
    } = useProviders(elemIsAsset ?? false, false, selectedElement?.uri || '', {});

    const {
        isLoading: isDependentsLoading,
        isError: isDependentsError,
        error: dependentsError,
        data: dependents,
    } = useDependents(elemIsAsset ?? false, false, selectedElement?.uri || '', {});

    if (!selectedElement) {
        return null;
    }

    if (assetInfo.isLoading) {
        return (
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (assetInfo.isError && elemIsStatic) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="error">Error fetching details for {selectedElement?.uri || 'this asset'}</Alert>
            </Box>
        );
    }

    const details = elemIsAsset ? ((selectedElement as Asset)?.getDetails?.(assetInfo.data) ?? undefined) : undefined;

    if (!details || isEmpty(details)) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="warning">Unable to retrieve details for this asset</Alert>
            </Box>
        );
    }

    const assetElement = elemIsAsset ? (selectedElement as Asset) : null;
    const hasCoordinates = Boolean(assetElement?.lat && assetElement?.lng);
    const streetViewUrl =
        hasCoordinates && assetElement ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${assetElement.lat},${assetElement.lng}` : null;

    const filteredDependents = dependents?.map(transformToConnectedAsset).filter((d) => d && !d.error) || [];
    const filteredProviders = providers?.map(transformToConnectedAsset).filter((p) => p && !p.error) || [];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <IconButton size="small" onClick={onBack} aria-label="Back to previous panel">
                    <ArrowBackIcon fontSize="small" />
                </IconButton>
                <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                    {details.title || 'Asset Details'}
                </Typography>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ px: 2, py: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Asset Details
                    </Typography>
                </Box>
                <Box sx={{ px: 2, pb: 2 }}>
                    {details.type && (
                        <Typography
                            variant="body2"
                            sx={{
                                textTransform: 'uppercase',
                                mb: details.desc ? 1 : 0,
                                color: 'text.secondary',
                            }}
                        >
                            {noCase(getURIFragment(details.type))}
                        </Typography>
                    )}
                    {details.desc && (
                        <Typography
                            variant="body2"
                            sx={{
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                whiteSpace: 'pre-line',
                                color: 'text.secondary',
                            }}
                        >
                            {details.desc}
                        </Typography>
                    )}
                </Box>

                <StreetViewSection hasCoordinates={hasCoordinates} streetViewUrl={streetViewUrl} />

                <ConnectedAssetsSection
                    filteredDependents={filteredDependents}
                    filteredProviders={filteredProviders}
                    isDependentsLoading={isDependentsLoading}
                    isDependentsError={isDependentsError}
                    dependentsError={dependentsError}
                    isProvidersLoading={isProvidersLoading}
                    isProvidersError={isProvidersError}
                    providersError={providersError}
                />
            </Box>
        </Box>
    );
};

export default AssetDetailsPanel;
