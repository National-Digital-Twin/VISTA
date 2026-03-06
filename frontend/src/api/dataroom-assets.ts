// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { Geometry } from 'geojson';
import config from '@/config/app-config';

export const MAX_CRITICALITY_SCORE = 3;

export type DataroomAsset = {
    id: string;
    name: string;
    geometry: Geometry;
    assetTypeId: string;
    assetTypeName: string;
    subCategoryName: string;
    categoryName: string;
    criticalityScore: number;
    criticalityIsOverridden: boolean;
};

export type CriticalityUpdateItem = {
    assetId: string;
    criticalityScore: number;
};

export type BulkCriticalityRequest = {
    updates: CriticalityUpdateItem[];
};

export type BulkCriticalityResponse = {
    updatedCount: number;
};

export type FetchDataroomAssetsParams = {
    scenarioId: string;
    categoryId?: string;
    subCategoryId?: string;
    assetTypeId?: string;
    geometry?: string;
};

export const fetchDataroomAssets = async (params: FetchDataroomAssetsParams): Promise<DataroomAsset[]> => {
    const searchParams = new URLSearchParams();
    if (params.categoryId) {
        searchParams.set('category_id', params.categoryId);
    }
    if (params.subCategoryId) {
        searchParams.set('sub_category_id', params.subCategoryId);
    }
    if (params.assetTypeId) {
        searchParams.set('asset_type_id', params.assetTypeId);
    }
    if (params.geometry) {
        searchParams.set('geometry', params.geometry);
    }

    const url = `${config.services.apiBaseUrl}/scenarios/${params.scenarioId}/dataroom/assets/?${searchParams.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch dataroom assets: ${response.statusText}`);
    }

    return response.json();
};

export const updateBulkCriticality = async (scenarioId: string, data: BulkCriticalityRequest): Promise<BulkCriticalityResponse> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/dataroom/assets/criticality/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error(`Failed to update criticality: ${response.statusText}`);
    }

    return response.json();
};
