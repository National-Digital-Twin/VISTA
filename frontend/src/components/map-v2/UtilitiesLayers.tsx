import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import type { FeatureCollection } from 'geojson';

const SOURCE_ID = 'map-v2-utilities-source';
const LAYER_ID = 'map-v2-utilities-layer';
const DEFAULT_LINE_COLOR = '#FF6B35';
const DEFAULT_LINE_WIDTH = 3;
const DEFAULT_LINE_OPACITY = 0.8;

export type UtilitiesLayersProps = {
    readonly utilities: FeatureCollection;
    readonly selectedUtilityIds: Record<string, boolean>;
    readonly mapReady?: boolean;
};

const UtilitiesLayers = ({ utilities, selectedUtilityIds, mapReady }: UtilitiesLayersProps) => {
    const filteredFeatures = useMemo(() => {
        const enabledIdsSet = new Set(
            Object.entries(selectedUtilityIds)
                .filter(([, enabled]) => enabled)
                .map(([id]) => id),
        );

        if (enabledIdsSet.size === 0) {
            return [];
        }

        const filtered = utilities.features.filter((feature) => {
            const featureId = feature.id || feature.properties?.id;
            const idString = featureId !== null && featureId !== undefined ? String(featureId) : null;
            if (idString) {
                return enabledIdsSet.has(idString);
            }
            return false;
        });

        return filtered;
    }, [utilities, selectedUtilityIds]);

    const featureCollection: FeatureCollection = useMemo(
        () => ({
            type: 'FeatureCollection',
            features: filteredFeatures,
        }),
        [filteredFeatures],
    );

    if (!mapReady || filteredFeatures.length === 0) {
        return null;
    }

    return (
        <Source id={SOURCE_ID} type="geojson" data={featureCollection}>
            <Layer
                id={LAYER_ID}
                type="line"
                paint={{
                    'line-color': DEFAULT_LINE_COLOR,
                    'line-width': DEFAULT_LINE_WIDTH,
                    'line-opacity': DEFAULT_LINE_OPACITY,
                }}
            />
        </Source>
    );
};

export default UtilitiesLayers;
