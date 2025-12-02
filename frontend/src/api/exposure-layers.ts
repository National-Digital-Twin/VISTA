import type { FeatureCollection, Feature, Geometry } from 'geojson';
import { createApiEndpoint, fetchOptions } from './utils';
import { parseGeometry as parseGeometryString } from './geometry-parser';

export const fetchExposureLayers = async (): Promise<FeatureCollection> => {
    try {
        const response = await fetch(createApiEndpoint('exposurelayers/'), fetchOptions);

        if (!response.ok) {
            throw new Error(`Failed to retrieve exposure layers: ${response.statusText}`);
        }

        const data = await response.json();

        const features: Feature[] = (data.features || [])
            .map((feature: any) => {
                const geometry: Geometry | null = typeof feature.geometry === 'string' ? parseGeometryString(feature.geometry) : feature.geometry;

                if (!geometry) {
                    console.warn('Failed to parse geometry for feature:', feature.id, feature.properties?.name);
                    return null;
                }

                return {
                    type: 'Feature',
                    id: feature.id,
                    geometry,
                    properties: feature.properties || {},
                };
            })
            .filter((feature: Feature | null): feature is Feature => feature !== null);

        return {
            type: 'FeatureCollection',
            features,
        };
    } catch (error) {
        console.error('Error fetching exposure layers:', error);
        throw error;
    }
};
