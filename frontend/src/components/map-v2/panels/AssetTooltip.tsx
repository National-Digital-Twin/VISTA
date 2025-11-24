import { useQuery } from '@tanstack/react-query';
import { noCase } from 'change-case';
import { Box, Typography } from '@mui/material';
import { getURIFragment, isAsset } from '@/utils';
import { fetchAssetInfo } from '@/api/combined';
import { AssetState } from '@/models/Asset';
import type { Asset, Element } from '@/models';

interface AssetTooltipProps {
    readonly element: Element;
}

const AssetTooltip = ({ element }: AssetTooltipProps) => {
    const elemIsAsset = isAsset(element);
    const elemIsStatic = elemIsAsset && (element as Asset)?.state === AssetState.Static;

    const { data: assetInfo } = useQuery({
        queryKey: ['asset-info', element?.uri || ''],
        queryFn: () => fetchAssetInfo(element?.uri || ''),
        enabled: elemIsAsset && elemIsStatic,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    const details = elemIsAsset ? ((element as Asset)?.getDetails?.(assetInfo) ?? undefined) : undefined;
    const title = details?.title || element?.uri || 'Unknown';
    const type = details?.type || (element as Asset)?.type || '';
    const typeLabel = type ? noCase(getURIFragment(type)) : '';

    return (
        <Box
            sx={{
                bgcolor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                p: 1,
                borderRadius: 1,
                minWidth: '240px',
                maxWidth: '300px',
            }}
        >
            <Typography variant="body2" sx={{ fontWeight: 600, mb: typeLabel ? 0.5 : 0 }}>
                {title}
            </Typography>
            {typeLabel && (
                <Typography variant="caption" sx={{ textTransform: 'uppercase', opacity: 0.9 }}>
                    {typeLabel}
                </Typography>
            )}
        </Box>
    );
};

export default AssetTooltip;
