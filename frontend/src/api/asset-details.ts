import config from '@/config/app-config';

export interface AssetDetailsResponse {
    readonly id: string;
    readonly name: string;
    readonly geom: string;
    readonly type: {
        readonly id: string;
        readonly name: string;
    };
    readonly providers: Array<{
        readonly id: string;
        readonly name: string;
        readonly geom: string;
        readonly type: {
            readonly id: string;
            readonly name: string;
        };
    }>;
    readonly dependents: Array<{
        readonly id: string;
        readonly name: string;
        readonly geom: string;
        readonly type: {
            readonly id: string;
            readonly name: string;
        };
    }>;
}

export const fetchAssetDetails = async (assetId: string): Promise<AssetDetailsResponse> => {
    const response = await fetch(`${config.services.apiBaseUrl}/assets/${assetId}/`, {
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        throw new Error(`Failed to retrieve asset details for ${assetId}`);
    }
    return response.json();
};
