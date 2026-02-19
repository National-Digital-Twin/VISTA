import type { AssetDetailsResponse } from './asset-details';
import config from '@/config/app-config';

export const fetchAssetById = async (assetId: string): Promise<AssetDetailsResponse | null> => {
    const response = await fetch(`${config.services.apiBaseUrl}/assets/${assetId}/`, {
        headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`Failed to retrieve asset details for ${assetId}`);
    }

    return response.json();
};
