import config from '@/config/app-config';

export type AssetScore = {
    id: string;
    scenarioId: string;
    userId: string;
    criticalityScore: string;
    dependencyScore: string;
    exposureScore: string;
    redundancyScore: string;
};

export const fetchAssetScore = async (scenarioId: string, assetId: string): Promise<AssetScore> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/assetscores/${assetId}/`, {
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        throw new Error(`Failed to retrieve asset score for ${assetId}: ${response.statusText}`);
    }
    return response.json();
};
