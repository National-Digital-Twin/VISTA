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
    focusAreaId: string;
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

export const fetchExposureLayerVisibility = async (scenarioId: string, focusAreaId: string): Promise<ExposureLayerGroup[]> => {
    const url = `${config.services.apiBaseUrl}/scenarios/${scenarioId}/exposure-layers/?focus_area_id=${focusAreaId}`;

    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Failed to retrieve exposure layer visibility: ${response.statusText}`);
    }

    return response.json();
};

export const mergeGeometryWithVisibility = (geometryData: ExposureLayerGroup[], visibilityData: ExposureLayerGroup[]): ExposureLayersResponse => {
    // Build geometry lookup from geometryData
    const geometryMap = new Map<string, Geometry>();
    geometryData.forEach((group) => {
        group.exposureLayers.forEach((layer) => {
            if (layer.geometry) {
                geometryMap.set(layer.id, layer.geometry);
            }
        });
    });

    // Use visibilityData as the source of truth for which layers to include
    // (backend already filters by focus area geometry)
    const mergedGroups: ExposureLayerGroup[] = visibilityData.map((group) => ({
        id: group.id,
        name: group.name,
        exposureLayers: group.exposureLayers.map((layer) => ({
            ...layer,
            geometry: geometryMap.get(layer.id),
            isActive: layer.isActive ?? false,
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

export const fetchExposureLayers = async (scenarioId: string, focusAreaId: string): Promise<ExposureLayersResponse> => {
    const [geometryData, visibilityData] = await Promise.all([fetchExposureLayerGeometry(), fetchExposureLayerVisibility(scenarioId, focusAreaId)]);

    return mergeGeometryWithVisibility(geometryData, visibilityData);
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
