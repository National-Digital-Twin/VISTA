import type { Feature, FeatureCollection, Geometry } from 'geojson';
import config from '@/config/app-config';

export type FocusAreaRelation = 'contained' | 'overlaps' | 'elsewhere';

export type ExposureLayerGroup = {
    id: string;
    name: string;
    isUserEditable?: boolean;
    exposureLayers: ExposureLayer[];
};

export type ExposureLayer = {
    id: string;
    name: string;
    geometry?: Geometry;
    isActive?: boolean;
    isUserDefined?: boolean;
    createdAt?: string;
    focusAreaRelation?: FocusAreaRelation;
};

export type ExposureLayersResponse = {
    featureCollection: FeatureCollection;
    groups: ExposureLayerGroup[];
};

export type ToggleExposureLayerVisibilityRequest = {
    exposureLayerId: string;
    focusAreaId: string;
    isActive: boolean;
};

export type CreateExposureLayerRequest = {
    typeId: string;
    geometry: Geometry;
    name?: string;
    focusAreaId?: string;
};

export type UpdateExposureLayerRequest = {
    name?: string;
    geometry?: Geometry;
};

export type BulkToggleVisibilityRequest = {
    focusAreaId: string;
    isActive: boolean;
    exposureLayerIds?: string[];
    typeId?: string;
};

export const fetchExposureLayers = async (scenarioId: string, focusAreaId?: string | null): Promise<ExposureLayersResponse> => {
    const params = focusAreaId ? `?focus_area_id=${focusAreaId}` : '';
    const url = `${config.services.apiBaseUrl}/scenarios/${scenarioId}/exposure-layers/${params}`;

    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Failed to retrieve exposure layers: ${response.statusText}`);
    }

    const groups: ExposureLayerGroup[] = await response.json();

    const features: Feature[] = groups.flatMap((group) =>
        group.exposureLayers
            .filter((layer) => layer.geometry)
            .map((layer) => ({
                type: 'Feature' as const,
                id: layer.id,
                geometry: layer.geometry!,
                properties: {
                    name: layer.name,
                    groupId: group.id,
                    groupName: group.name,
                    isActive: layer.isActive ?? false,
                    isUserDefined: layer.isUserDefined ?? false,
                    focusAreaRelation: layer.focusAreaRelation,
                },
            })),
    );

    return {
        featureCollection: { type: 'FeatureCollection', features },
        groups,
    };
};

export const toggleExposureLayerVisibility = async (scenarioId: string, data: ToggleExposureLayerVisibilityRequest): Promise<void> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/visible-exposure-layers/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            exposureLayerId: data.exposureLayerId,
            focusAreaId: data.focusAreaId,
            isActive: data.isActive,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to toggle exposure layer visibility: ${response.statusText}`);
    }
};

export const bulkToggleExposureLayerVisibility = async (scenarioId: string, data: BulkToggleVisibilityRequest): Promise<void> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/visible-exposure-layers/bulk/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`Failed to bulk toggle exposure layer visibility: ${response.statusText}`);
    }
};

export const createExposureLayer = async (scenarioId: string, data: CreateExposureLayerRequest): Promise<ExposureLayer> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/exposure-layers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`Failed to create exposure layer: ${response.statusText}`);
    }

    return response.json();
};

export const updateExposureLayer = async (scenarioId: string, exposureLayerId: string, data: UpdateExposureLayerRequest): Promise<ExposureLayer> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/exposure-layers/${exposureLayerId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`Failed to update exposure layer: ${response.statusText}`);
    }

    return response.json();
};

export const deleteExposureLayer = async (scenarioId: string, exposureLayerId: string): Promise<void> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/exposure-layers/${exposureLayerId}/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Failed to delete exposure layer: ${response.statusText}`);
    }
};
