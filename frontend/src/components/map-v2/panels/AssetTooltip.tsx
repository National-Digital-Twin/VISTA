import { noCase } from 'change-case';
import { Box, Typography } from '@mui/material';
import { isAsset } from '@/utils';
import type { Asset, Element } from '@/models';

interface AssetTooltipProps {
    readonly element: Element;
}

const AssetTooltip = ({ element }: AssetTooltipProps) => {
    const elemIsAsset = isAsset(element);
    const asset = element as Asset;
    const details = elemIsAsset ? (asset?.getDetails?.(null) ?? undefined) : undefined;
    const title = details?.title || asset?.name || element?.id || 'Unknown';
    const type = asset?.secondaryCategory || '';
    const typeLabel = type ? noCase(type) : '';

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
