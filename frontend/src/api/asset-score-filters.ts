// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import config from '@/config/app-config';

export type ScoreFilterValues = {
    criticalityValues: number[] | null;
    exposureValues: number[] | null;
    redundancyValues: number[] | null;
    dependencyMin: string | null;
    dependencyMax: string | null;
};

export type AssetScoreFilter = ScoreFilterValues & {
    id: string;
    focusAreaId: string | null;
    assetTypeId: string | null;
};

export type CreateUpdateScoreFilterRequest = ScoreFilterValues & {
    focusAreaId: string | null;
    assetTypeId: string | null;
};

export const fetchAssetScoreFilters = async (scenarioId: string): Promise<AssetScoreFilter[]> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/asset-score-filters/`, {
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch asset score filters: ${response.statusText}`);
    }

    return response.json();
};

export const putAssetScoreFilter = async (scenarioId: string, data: CreateUpdateScoreFilterRequest): Promise<AssetScoreFilter> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/asset-score-filters/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            focusAreaId: data.focusAreaId,
            assetTypeId: data.assetTypeId,
            criticalityValues: data.criticalityValues,
            exposureValues: data.exposureValues,
            redundancyValues: data.redundancyValues,
            dependencyMin: data.dependencyMin,
            dependencyMax: data.dependencyMax,
        }),
    });
    if (!response.ok) {
        throw new Error(`Failed to save asset score filter: ${response.statusText}`);
    }

    return response.json();
};

export const deleteAssetScoreFilter = async (scenarioId: string, focusAreaId: string | null, assetTypeId: string | null): Promise<void> => {
    const params = new URLSearchParams();
    if (focusAreaId) {
        params.set('focus_area_id', focusAreaId);
    }
    if (assetTypeId) {
        params.set('asset_type_id', assetTypeId);
    }

    const url = `${config.services.apiBaseUrl}/scenarios/${scenarioId}/asset-score-filters/?${params.toString()}`;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        throw new Error(`Failed to delete asset score filter: ${response.statusText}`);
    }
};
