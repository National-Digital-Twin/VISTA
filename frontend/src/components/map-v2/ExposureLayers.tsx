import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import type { Feature, FeatureCollection } from 'geojson';

const SOURCE_ID = 'map-v2-exposure-source';
const LAYER_ID = 'map-v2-exposure-layer';
const DEFAULT_FILL_COLOR = '#4A90E2';
const DEFAULT_FILL_OPACITY = 0.3;
const DEFAULT_STROKE_COLOR = '#2E5C8A';
const DEFAULT_STROKE_WIDTH = 2;

export interface ExposureLayersProps {
    readonly exposureLayers: FeatureCollection;
    readonly selectedExposureLayerIds: Record<string, boolean>;
    readonly mapReady?: boolean;
}

const ExposureLayers = ({ exposureLayers, selectedExposureLayerIds, mapReady }: ExposureLayersProps) => {
    const filteredFeatures = useMemo(() => {
        const enabledIdsSet = new Set(
            Object.entries(selectedExposureLayerIds)
                .filter(([, enabled]) => enabled)
                .map(([id]) => id),
        );

        if (enabledIdsSet.size === 0) {
            return [];
        }

        const filtered = exposureLayers.features.filter((feature) => {
            const featureId = feature.id || feature.properties?.id;
            const idString = featureId !== null && featureId !== undefined ? String(featureId) : null;
            if (idString) {
                return enabledIdsSet.has(idString);
            }
            console.warn('Feature missing ID:', feature);
            return false;
        });
        return filtered;
    }, [exposureLayers, selectedExposureLayerIds]);

    const featureCollection: FeatureCollection = useMemo(() => {
        const enhancedFeatures: Feature[] = filteredFeatures.map((feature) => {
            const featureId = feature.id || feature.properties?.id;
            const idString = featureId !== null && featureId !== undefined ? String(featureId) : undefined;

            return {
                type: 'Feature',
                id: idString,
                geometry: feature.geometry,
                properties: feature.properties || {},
            };
        });

        return {
            type: 'FeatureCollection',
            features: enhancedFeatures,
        };
    }, [filteredFeatures]);

    if (!mapReady || filteredFeatures.length === 0) {
        return null;
    }

    return (
        <Source id={SOURCE_ID} type="geojson" data={featureCollection}>
            <Layer
                id={LAYER_ID}
                type="fill"
                paint={{
                    'fill-color': DEFAULT_FILL_COLOR,
                    'fill-opacity': DEFAULT_FILL_OPACITY,
                }}
            />
            <Layer
                id={`${LAYER_ID}-outline`}
                type="line"
                paint={{
                    'line-color': DEFAULT_STROKE_COLOR,
                    'line-width': DEFAULT_STROKE_WIDTH,
                }}
            />
        </Source>
    );
};

export default ExposureLayers;
