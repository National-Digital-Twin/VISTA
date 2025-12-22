import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import { useQueries } from '@tanstack/react-query';
import type { FeatureCollection, Feature } from 'geojson';
import { fetchExposureLayers } from '@/api/exposure-layers';

const SOURCE_ID = 'map-v2-exposure-source';
const LAYER_ID = 'map-v2-exposure-layer';
const DEFAULT_FILL_COLOR = '#4A90E2';
const DEFAULT_FILL_OPACITY = 0.3;
const DEFAULT_STROKE_COLOR = '#2E5C8A';
const DEFAULT_STROKE_WIDTH = 2;

export type ExposureLayersProps = {
    scenarioId?: string;
    selectedFocusAreaId?: string | null;
    mapReady?: boolean;
    isInFocusAreaPanel?: boolean;
    activeFocusAreaIds?: string[];
};

const ExposureLayers = ({ scenarioId, selectedFocusAreaId, mapReady, isInFocusAreaPanel = false, activeFocusAreaIds = [] }: ExposureLayersProps) => {
    const queryConfigs = useMemo(() => {
        if (!scenarioId) {
            return [];
        }

        if (isInFocusAreaPanel) {
            return activeFocusAreaIds.map((faId) => ({
                queryKey: ['exposureLayers', scenarioId, faId],
                queryFn: () => fetchExposureLayers(scenarioId, faId),
                staleTime: 0,
            }));
        }

        if (!selectedFocusAreaId) {
            return [];
        }

        return [
            {
                queryKey: ['exposureLayers', scenarioId, selectedFocusAreaId],
                queryFn: () => fetchExposureLayers(scenarioId, selectedFocusAreaId),
                staleTime: 0,
            },
        ];
    }, [scenarioId, isInFocusAreaPanel, activeFocusAreaIds, selectedFocusAreaId]);

    const exposureQueries = useQueries({
        queries: queryConfigs.length > 0 ? queryConfigs : [],
    });

    const isLoading = exposureQueries.some((q) => q.isLoading);

    const filteredFeatures = useMemo(() => {
        const activeFeatureIds = new Set<string>();
        const featuresById = new Map<string, Feature>();

        exposureQueries.forEach((query) => {
            if (!query.data?.featureCollection?.features) {
                return;
            }

            query.data.featureCollection.features.forEach((feature: Feature) => {
                const featureId = feature.id?.toString() || feature.properties?.id;
                if (!featureId) {
                    return;
                }

                if (!featuresById.has(featureId)) {
                    featuresById.set(featureId, feature);
                }

                if (feature.properties?.isActive === true) {
                    activeFeatureIds.add(featureId);
                }
            });
        });

        return Array.from(featuresById.values()).filter((feature) => {
            const featureId = feature.id?.toString() || feature.properties?.id;
            return featureId && activeFeatureIds.has(featureId);
        });
    }, [exposureQueries]);

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
