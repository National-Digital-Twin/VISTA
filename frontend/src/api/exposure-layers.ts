import type { Feature, FeatureCollection, Geometry } from 'geojson';
import config from '@/config/app-config';

export type ExposureLayerGroup = {
    id: string;
    name: string;
    exposureLayers: ExposureLayer[];
};

export type ExposureLayer = {
    id: string;
    name: string;
    geometry?: Geometry;
    isActive?: boolean;
};

export type ExposureLayersResponse = {
    featureCollection: FeatureCollection;
    groups: ExposureLayerGroup[];
};

export type ToggleExposureLayerVisibilityRequest = {
    exposureLayerId: string;
    focusAreaId?: string | null;
    isActive: boolean;
};

export const fetchExposureLayerGeometry = async (): Promise<ExposureLayerGroup[]> => {
    const response = await fetch(`${config.services.apiBaseUrl}/exposurelayers/`, {
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Failed to retrieve exposure layer geometry: ${response.statusText}`);
    }

    return response.json();
};

export const fetchExposureLayerVisibility = async (scenarioId: string, focusAreaId?: string | null): Promise<ExposureLayerGroup[]> => {
    let url = `${config.services.apiBaseUrl}/scenarios/${scenarioId}/exposure-layers/`;
    if (focusAreaId !== undefined && focusAreaId !== null) {
        url += `?focus_area_id=${focusAreaId}`;
    }

    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Failed to retrieve exposure layer visibility: ${response.statusText}`);
    }

    return response.json();
};

export const mergeGeometryWithVisibility = (geometryData: ExposureLayerGroup[], visibilityData: ExposureLayerGroup[]): ExposureLayersResponse => {
    const visibilityMap = new Map<string, boolean>();
    visibilityData.forEach((group) => {
        group.exposureLayers.forEach((layer) => {
            visibilityMap.set(layer.id, layer.isActive ?? false);
        });
    });

    const mergedGroups: ExposureLayerGroup[] = geometryData.map((group) => ({
        id: group.id,
        name: group.name,
        exposureLayers: group.exposureLayers.map((layer) => ({
            ...layer,
            isActive: visibilityMap.get(layer.id) ?? false,
        })),
    }));

    const features: Feature[] = mergedGroups.flatMap((group) =>
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
                },
            })),
    );

    return {
        featureCollection: {
            type: 'FeatureCollection',
            features,
        },
        groups: mergedGroups,
    };
};

export const fetchExposureLayers = async (scenarioId: string, focusAreaId?: string | null): Promise<ExposureLayersResponse> => {
    const [geometryData, visibilityData] = await Promise.all([fetchExposureLayerGeometry(), fetchExposureLayerVisibility(scenarioId, focusAreaId)]);

    return mergeGeometryWithVisibility(geometryData, visibilityData);
};

export const toggleExposureLayerVisibility = async (scenarioId: string, data: ToggleExposureLayerVisibilityRequest): Promise<void> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/visible-exposure-layers/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            exposureLayerId: data.exposureLayerId,
            focusAreaId: data.focusAreaId ?? null,
            isActive: data.isActive,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to toggle exposure layer visibility: ${response.statusText}`);
    }
};
