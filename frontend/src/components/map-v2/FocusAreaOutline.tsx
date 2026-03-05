// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { Geometry, Feature, Position } from 'geojson';
import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import { BELOW_ASSET_LAYER_ID } from './constants';

const SOURCE_ID = 'focus-area-outline-source';
const FILL_LAYER_ID = 'focus-area-outline-fill-layer';
const LINE_LAYER_ID = 'focus-area-outline-line-layer';

type FocusAreaOutlineProps = {
    readonly geometry: Geometry | null;
    readonly fillColor?: string;
    readonly fillOpacity?: number;
    readonly lineColor?: string;
    readonly lineWidth?: number;
};

const FocusAreaOutline = ({ geometry, fillColor = 'transparent', fillOpacity = 0, lineColor = '#666666', lineWidth = 2 }: FocusAreaOutlineProps) => {
    const feature = useMemo((): Feature | null => {
        if (!geometry || (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon')) {
            return null;
        }

        if (geometry.type === 'Polygon') {
            const outerRing = (geometry.coordinates as Position[][])[0];
            if (!outerRing || outerRing.length === 0) {
                return null;
            }
        }

        return {
            type: 'Feature',
            properties: {},
            geometry,
        };
    }, [geometry]);

    if (!feature) {
        return null;
    }

    return (
        <Source id={SOURCE_ID} type="geojson" data={feature}>
            <Layer
                id={FILL_LAYER_ID}
                type="fill"
                beforeId={BELOW_ASSET_LAYER_ID}
                paint={{
                    'fill-color': fillColor,
                    'fill-opacity': fillOpacity,
                }}
            />
            <Layer
                id={LINE_LAYER_ID}
                type="line"
                beforeId={BELOW_ASSET_LAYER_ID}
                paint={{
                    'line-color': lineColor,
                    'line-width': lineWidth,
                    'line-dasharray': [2, 2],
                }}
            />
        </Source>
    );
};

export default FocusAreaOutline;
