import type { Feature, FeatureCollection, Geometry } from 'geojson';
import config from '@/config/app-config';

export type FocusAreaRelation = 'contained' | 'overlaps' | 'elsewhere';

export type ExposureLayerStatus = 'unpublished' | 'pending' | 'approved';

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
    status?: ExposureLayerStatus | null;
    publishedId?: string | null;
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

    // TODO: remove once the publishedId is added to the response
    for (const group of groups) {
        for (const layer of group.exposureLayers) {
            if (layer.status === 'approved' && !layer.publishedId) {
                layer.publishedId = `UD.${layer.id.slice(-4).toUpperCase()}`;
            }
        }
    }

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
                    status: layer.status,
                    publishedId: layer.publishedId,
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

export const publishExposureLayer = async (scenarioId: string, exposureLayerId: string): Promise<void> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/exposure-layers/${exposureLayerId}/publish/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Failed to publish exposure layer: ${response.statusText}`);
    }
};

export type DataroomExposureLayer = {
    id: string;
    name: string;
    geometry?: Geometry;
    status: 'pending' | 'approved' | 'unpublished' | null;
    isUserDefined?: boolean;
    createdAt?: string;
    updatedAt?: string;
    user?: { id: string; name: string | null };
    type?: { id: string; name: string };
};

export const fetchDataroomExposureLayers = async (scenarioId: string): Promise<DataroomExposureLayer[]> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/dataroom/exposure-layers/`, {
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch dataroom exposure layers: ${response.statusText}`);
    }

    return response.json();
};

export const approveExposureLayer = async (scenarioId: string, exposureLayerId: string): Promise<void> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/exposure-layers/${exposureLayerId}/approve/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Failed to approve exposure layer: ${response.statusText}`);
    }
};

export const rejectExposureLayer = async (scenarioId: string, exposureLayerId: string): Promise<void> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/exposure-layers/${exposureLayerId}/reject/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Failed to reject exposure layer: ${response.statusText}`);
    }
};

export const removeExposureLayer = async (scenarioId: string, exposureLayerId: string): Promise<void> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/exposure-layers/${exposureLayerId}/remove/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Failed to remove exposure layer: ${response.statusText}`);
    }
};
