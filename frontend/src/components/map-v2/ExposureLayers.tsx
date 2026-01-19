import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import { useQuery } from '@tanstack/react-query';
import type { FeatureCollection, Feature } from 'geojson';
import { fetchExposureLayers } from '@/api/exposure-layers';

const SOURCE_ID = 'map-v2-exposure-source';
const LAYER_ID = 'map-v2-exposure-layer';
const FILL_OPACITY = 0.3;
const STROKE_WIDTH = 2;

const FILL_COLOR = '#4A90E2';
const STROKE_COLOR = '#2E5C8A';

export type ExposureLayersProps = {
    scenarioId?: string;
    selectedFocusAreaId?: string | null;
    mapReady?: boolean;
    isInFocusAreaPanel?: boolean;
    excludeUserDefined?: boolean;
};

const ExposureLayers = ({ scenarioId, selectedFocusAreaId, mapReady, isInFocusAreaPanel = false, excludeUserDefined = false }: ExposureLayersProps) => {
    // When in focus area panel, fetch all active focus areas (no focus_area_id param)
    // Otherwise, fetch for the selected focus area
    const focusAreaIdForQuery = isInFocusAreaPanel ? null : selectedFocusAreaId;

    const { data: exposureData, isLoading } = useQuery({
        queryKey: ['exposureLayers', scenarioId, focusAreaIdForQuery],
        queryFn: () => fetchExposureLayers(scenarioId!, focusAreaIdForQuery),
        enabled: !!scenarioId && (isInFocusAreaPanel || !!selectedFocusAreaId),
        staleTime: 0,
    });

    const filteredFeatures = useMemo(() => {
        if (!exposureData?.featureCollection?.features) {
            return [];
        }

        return exposureData.featureCollection.features.filter((feature: Feature) => {
            // Only include active features
            if (feature.properties?.isActive !== true) {
                return false;
            }
            // Exclude user-defined layers when they're being rendered via MapboxDraw
            if (excludeUserDefined && feature.properties?.isUserDefined) {
                return false;
            }
            return true;
        });
    }, [exposureData, excludeUserDefined]);

    const featureCollection: FeatureCollection = useMemo(() => {
        return {
            type: 'FeatureCollection',
            features: filteredFeatures,
        };
    }, [filteredFeatures]);

    if (!mapReady || !scenarioId || isLoading || filteredFeatures.length === 0) {
        return null;
    }

    return (
        <Source id={SOURCE_ID} type="geojson" data={featureCollection} generateId>
            <Layer
                id={LAYER_ID}
                type="fill"
                paint={{
                    'fill-color': FILL_COLOR,
                    'fill-opacity': FILL_OPACITY,
                }}
            />
            <Layer
                id={`${LAYER_ID}-outline`}
                type="line"
                paint={{
                    'line-color': STROKE_COLOR,
                    'line-width': STROKE_WIDTH,
                }}
            />
        </Source>
    );
};

export default ExposureLayers;
