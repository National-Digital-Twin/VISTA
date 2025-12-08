import { noCase } from 'change-case';
import { Box, Typography } from '@mui/material';
import { getAssetTypeName } from '../utils/getAssetTypeName';
import { isAsset } from '@/utils';
import { formatAssetDetails } from '@/utils/assetUtils';
import type { Asset } from '@/api/assets-by-type';
import type { AssetCategory } from '@/api/asset-categories';

type AssetTooltipProps = {
    element: Asset;
    assetCategories?: AssetCategory[];
};

const AssetTooltip = ({ element, assetCategories }: AssetTooltipProps) => {
    const elemIsAsset = isAsset(element);
    const asset = elemIsAsset ? element : null;
    const details = elemIsAsset && asset ? formatAssetDetails(asset) : undefined;
    const title = details?.title || asset?.name || (element?.id ? String(element.id) : null) || 'Unknown';

    const typeName = asset ? getAssetTypeName(asset.type, assetCategories) : null;
    const typeLabel = typeName ? noCase(typeName) : '';

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
