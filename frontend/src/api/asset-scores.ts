import config from '@/config/app-config';

export type AssetScore = {
    id: string;
    scenarioId: string;
    criticalityScore: string;
    dependencyScore: string;
    exposureScore: string;
    redundancyScore: string;
};

export const fetchAssetScore = async (scenarioId: string, assetId: string, focusAreaId?: string): Promise<AssetScore> => {
    const params = focusAreaId ? `?focus_area_id=${focusAreaId}` : '';
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/assetscores/${assetId}/${params}`, {
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        throw new Error(`Failed to retrieve asset score for ${assetId}: ${response.statusText}`);
    }
    return response.json();
};
