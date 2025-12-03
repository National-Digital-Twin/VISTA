import type { FeatureCollection, Feature, Geometry } from 'geojson';
import { createApiEndpoint, fetchOptions } from './utils';

export interface ExposureLayerGroup {
    readonly id: string;
    readonly name: string;
    readonly exposureLayers: ExposureLayer[];
}

export interface ExposureLayer {
    readonly id: string;
    readonly name: string;
    readonly geometry: Geometry;
}

export interface ExposureLayersResponse {
    readonly featureCollection: FeatureCollection;
    readonly groups: ExposureLayerGroup[];
}

export const fetchExposureLayers = async (): Promise<ExposureLayersResponse> => {
    try {
        const response = await fetch(createApiEndpoint('exposurelayers/'), fetchOptions);

        if (!response.ok) {
            throw new Error(`Failed to retrieve exposure layers: ${response.statusText}`);
        }

        const data: ExposureLayerGroup[] = await response.json();

        const groups: ExposureLayerGroup[] = data.map((group) => ({
            id: group.id,
            name: group.name,
            exposureLayers: group.exposureLayers,
        }));

        const features: Feature[] = data.flatMap((group) =>
            group.exposureLayers
                .filter((layer) => {
                    if (!layer.geometry) {
                        console.warn('Failed to parse geometry for layer:', layer.id, layer.name);
                        return false;
                    }
                    return true;
                })
                .map((layer) => ({
                    type: 'Feature' as const,
                    id: layer.id,
                    geometry: layer.geometry,
                    properties: {
                        name: layer.name,
                        groupId: group.id,
                        groupName: group.name,
                    },
                })),
        );

        return {
            featureCollection: {
                type: 'FeatureCollection',
                features,
            },
            groups,
        };
    } catch (error) {
        console.error('Error fetching exposure layers:', error);
        throw error;
    }
};
