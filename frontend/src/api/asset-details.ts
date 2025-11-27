import { fetchOptions } from './utils';

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

const BASE_URL = '/ndtp-python/api';

export const fetchAssetDetails = async (assetId: string): Promise<AssetDetailsResponse> => {
    const response = await fetch(`${BASE_URL}/assets/${assetId}/`, fetchOptions);
    if (!response.ok) {
        throw new Error(`Failed to retrieve asset details for ${assetId}`);
    }
    return response.json();
};
