// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { FilterSpecification } from 'maplibre-gl';
import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import { BELOW_ASSET_LAYER_ID } from '@/components/map-v2/constants';

const SOURCE_ID = 'dataroom-pending-exposure-source';
const DEFAULT_FILL_LAYER_ID = 'dataroom-pending-exposure-fill';
const DEFAULT_LINE_LAYER_ID = 'dataroom-pending-exposure-line';
const HIGHLIGHT_FILL_LAYER_ID = 'dataroom-pending-exposure-highlight-fill';
const HIGHLIGHT_LINE_LAYER_ID = 'dataroom-pending-exposure-highlight-line';

const DEFAULT_FILL_COLOR = '#e0e0e0';
const DEFAULT_FILL_OPACITY = 0.25;
const DEFAULT_LINE_COLOR = '#9e9e9e';
const DEFAULT_LINE_WIDTH = 2;

const HIGHLIGHT_FILL_COLOR = '#4A90E2';
const HIGHLIGHT_FILL_OPACITY = 0.3;
const HIGHLIGHT_LINE_COLOR = '#2E5C8A';
const HIGHLIGHT_LINE_WIDTH = 2;

export type PendingExposureLayer = {
    id: string;
    geometry: Geometry;
};

type PendingExposureOutlinesProps = {
    layers: PendingExposureLayer[];
    highlightedLayerId: string | null;
};

function isPolygonOrMultiPolygon(geometry: Geometry): boolean {
    return geometry.type === 'Polygon' || geometry.type === 'MultiPolygon';
}

export default function PendingExposureOutlines({ layers, highlightedLayerId }: Readonly<PendingExposureOutlinesProps>) {
    const featureCollection = useMemo((): FeatureCollection => {
        const features: Feature[] = layers
            .filter((layer) => isPolygonOrMultiPolygon(layer.geometry))
            .map((layer) => {
                const id = String(layer.id);
                return {
                    type: 'Feature' as const,
                    id,
                    properties: { id },
                    geometry: layer.geometry,
                };
            });
        return { type: 'FeatureCollection', features };
    }, [layers]);

    const highlightFilter = useMemo((): FilterSpecification | null => {
        if (!highlightedLayerId) {
            return null;
        }
        return ['==', ['get', 'id'], ['literal', String(highlightedLayerId)]];
    }, [highlightedLayerId]);

    if (featureCollection.features.length === 0) {
        return null;
    }

    return (
        <Source id={SOURCE_ID} type="geojson" data={featureCollection} generateId={false}>
            <Layer
                id={DEFAULT_FILL_LAYER_ID}
                type="fill"
                beforeId={BELOW_ASSET_LAYER_ID}
                paint={{
                    'fill-color': DEFAULT_FILL_COLOR,
                    'fill-opacity': DEFAULT_FILL_OPACITY,
                }}
            />
            <Layer
                id={DEFAULT_LINE_LAYER_ID}
                type="line"
                beforeId={BELOW_ASSET_LAYER_ID}
                paint={{
                    'line-color': DEFAULT_LINE_COLOR,
                    'line-width': DEFAULT_LINE_WIDTH,
                }}
            />
            {highlightFilter && (
                <Layer
                    id={HIGHLIGHT_FILL_LAYER_ID}
                    type="fill"
                    beforeId={BELOW_ASSET_LAYER_ID}
                    filter={highlightFilter}
                    paint={{
                        'fill-color': HIGHLIGHT_FILL_COLOR,
                        'fill-opacity': HIGHLIGHT_FILL_OPACITY,
                    }}
                />
            )}
            {highlightFilter && (
                <Layer
                    id={HIGHLIGHT_LINE_LAYER_ID}
                    type="line"
                    beforeId={BELOW_ASSET_LAYER_ID}
                    filter={highlightFilter}
                    paint={{
                        'line-color': HIGHLIGHT_LINE_COLOR,
                        'line-width': HIGHLIGHT_LINE_WIDTH,
                    }}
                />
            )}
        </Source>
    );
}
