import config from '@/config/app-config';

export type ScenarioAssetType = {
    id: string;
    name: string;
    assetCount: number;
    isActive: boolean;
    datasourceId: string | null;
};

export type ScenarioSubCategory = {
    id: string;
    name: string;
    assetTypes: ScenarioAssetType[];
};

export type ScenarioAssetCategory = {
    id: string;
    name: string;
    subCategories: ScenarioSubCategory[];
};

export type ToggleVisibilityRequest = {
    assetTypeId: string;
    focusAreaId?: string | null;
    isActive: boolean;
};

export type ToggleVisibilityResponse = {
    assetTypeId: string;
    focusAreaId: string | null;
    isActive: boolean;
};

export const fetchScenarioAssetTypes = async (scenarioId: string, focusAreaId?: string | null): Promise<ScenarioAssetCategory[]> => {
    let url = `${config.services.apiBaseUrl}/scenarios/${scenarioId}/asset-types/`;
    if (focusAreaId) {
        url += `?focus_area_id=${focusAreaId}`;
    }

    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch scenario asset types: ${response.statusText}`);
    }

    return response.json();
};

export const toggleAssetTypeVisibility = async (scenarioId: string, data: ToggleVisibilityRequest): Promise<ToggleVisibilityResponse> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/visible-asset-types/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            assetTypeId: data.assetTypeId,
            focusAreaId: data.focusAreaId ?? null,
            isActive: data.isActive,
        }),
    });
    if (!response.ok) {
        throw new Error(`Failed to toggle asset type visibility: ${response.statusText}`);
    }

    return response.json();
};

export const clearAllAssetTypeVisibility = async (scenarioId: string, focusAreaId?: string | null): Promise<void> => {
    let url = `${config.services.apiBaseUrl}/scenarios/${scenarioId}/visible-asset-types/`;
    if (focusAreaId) {
        url += `?focus_area_id=${focusAreaId}`;
    }

    const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        throw new Error(`Failed to clear asset type visibility: ${response.statusText}`);
    }
};
