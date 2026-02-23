import type { AssetDetailsResponse } from './asset-details';
import config from '@/config/app-config';

export type AssetExternalIdMatch = {
    id: string;
    name: string;
};

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

    return (await response.json()) as AssetDetailsResponse;
};

export const fetchAssetByExternalId = async (externalId: string): Promise<AssetExternalIdMatch | null> => {
    const params = new URLSearchParams({
        external_id: externalId,
    });
    const response = await fetch(`${config.services.apiBaseUrl}/assets/resolve-external-id/?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`Failed to resolve asset external ID ${externalId}`);
    }

    return response.json();
};
