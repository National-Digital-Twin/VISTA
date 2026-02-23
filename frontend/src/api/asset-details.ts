import config from '@/config/app-config';

export type AssetDetailsResponse = {
    id: string;
    externalId?: string;
    name: string;
    geom: string;
    type: {
        id: string;
        name: string;
    };
    providers: Array<{
        id: string;
        name: string;
        geom: string;
        type: {
            id: string;
            name: string;
        };
    }>;
    dependents: Array<{
        id: string;
        name: string;
        geom: string;
        type: {
            id: string;
            name: string;
        };
    }>;
};

export const fetchAssetDetails = async (assetId: string): Promise<AssetDetailsResponse> => {
    const response = await fetch(`${config.services.apiBaseUrl}/assets/${assetId}/`, {
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        throw new Error(`Failed to retrieve asset details for ${assetId}`);
    }
    return (await response.json()) as AssetDetailsResponse;
};
