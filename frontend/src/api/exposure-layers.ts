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
    geometry: Geometry;
};

export type ExposureLayersResponse = {
    featureCollection: FeatureCollection;
    groups: ExposureLayerGroup[];
};

export const fetchExposureLayers = async (): Promise<ExposureLayersResponse> => {
    const response = await fetch(`${config.services.apiBaseUrl}/exposurelayers/`, {
        headers: { 'Content-Type': 'application/json' },
    });

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
            .filter((layer) => layer.geometry)
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
};
