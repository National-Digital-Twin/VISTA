import { useQuery } from '@tanstack/react-query';
import { Box, CircularProgress, Alert, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { noCase } from 'change-case';
import StreetViewSection from './StreetViewSection';
import ConnectedAssetsSection from './ConnectedAssetsSection';
import { fetchAssetDetails } from '@/api/asset-details';
import { isAsset } from '@/utils';
import { isEmpty } from '@/utils/isEmpty';
import type { Asset, Element } from '@/models';

interface AssetDetailsPanelProps {
    readonly selectedElement: Element | null;
    readonly onBack: () => void;
}

const transformConnectedAsset = (item: { id: string; name: string; type: { id: string; name: string } }) => {
    return {
        id: item.id,
        name: item.name,
        assetType: item.type.name,
    };
};

const AssetDetailsPanel = ({ selectedElement, onBack }: AssetDetailsPanelProps) => {
    const elemIsAsset = isAsset(selectedElement ?? undefined);
    const assetId = elemIsAsset ? (selectedElement as Asset)?.id : null;

    const assetDetails = useQuery({
        enabled: elemIsAsset && !!assetId,
        queryKey: ['asset-details', assetId || ''],
        queryFn: () => fetchAssetDetails(assetId || ''),
    });

    if (!selectedElement) {
        return null;
    }

    if (assetDetails.isLoading) {
        return (
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (assetDetails.isError) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="error">Error fetching details for {selectedElement?.id || 'this asset'}</Alert>
            </Box>
        );
    }

    const assetInfoData = assetDetails.data
        ? {
              name: assetDetails.data.name,
              assetType: assetDetails.data.type.name,
              desc: undefined,
          }
        : null;

    const details = elemIsAsset ? ((selectedElement as Asset)?.getDetails?.(assetInfoData) ?? undefined) : undefined;

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

    const filteredDependents = assetDetails.data?.dependents?.map(transformConnectedAsset) || [];
    const filteredProviders = assetDetails.data?.providers?.map(transformConnectedAsset) || [];

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
                    {assetElement?.secondaryCategory && (
                        <Typography
                            variant="body2"
                            sx={{
                                textTransform: 'uppercase',
                                mb: details.desc ? 1 : 0,
                                color: 'text.secondary',
                            }}
                        >
                            {noCase(assetElement.secondaryCategory)}
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

                <ConnectedAssetsSection filteredDependents={filteredDependents} filteredProviders={filteredProviders} />
            </Box>
        </Box>
    );
};

export default AssetDetailsPanel;
