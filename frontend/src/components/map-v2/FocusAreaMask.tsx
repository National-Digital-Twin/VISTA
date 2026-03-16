// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { Geometry, Feature, Position } from 'geojson';
import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import { BELOW_ASSET_LAYER_ID } from './constants';

const MASK_SOURCE_ID = 'focus-area-mask-source';
const MASK_LAYER_ID = 'focus-area-mask-layer';
const FOCUS_SOURCE_ID = 'focus-area-highlight-source';
const FOCUS_FILL_LAYER_ID = 'focus-area-highlight-fill-layer';
const FOCUS_LINE_LAYER_ID = 'focus-area-highlight-line-layer';

const MASK_FILL_COLOUR = '#000000';
const MASK_FILL_OPACITY = 0.4;
const FOCUS_FILL_COLOUR = '#FF0C0C';
const FOCUS_FILL_OPACITY = 0.2;
const FOCUS_LINE_COLOUR = '#FF0C0C';
const FOCUS_LINE_WIDTH = 2;
const FOCUS_LINE_OPACITY = 0.6;

const WORLD_BOUNDS: Position[] = [
    [-180, -90],
    [-180, 90],
    [180, 90],
    [180, -90],
    [-180, -90],
];

type FocusAreaMaskProps = {
    readonly geometry: Geometry | null;
};

function reverseCoordinates(coords: Position[]): Position[] {
    return [...coords].reverse();
}

const FocusAreaMask = ({ geometry }: FocusAreaMaskProps) => {
    const maskFeature = useMemo(() => {
        if (geometry?.type !== 'Polygon') {
            return null;
        }

        const outerRing = (geometry.coordinates as Position[][])[0];
        if (!outerRing || outerRing.length === 0) {
            return null;
        }

        const hole = reverseCoordinates(outerRing);

        return {
            type: 'Feature' as const,
            properties: {},
            geometry: {
                type: 'Polygon' as const,
                coordinates: [WORLD_BOUNDS, hole],
            },
        };
    }, [geometry]);

    const focusFeature = useMemo((): Feature | null => {
        if (geometry?.type !== 'Polygon') {
            return null;
        }

        const outerRing = (geometry.coordinates as Position[][])[0];
        if (!outerRing || outerRing.length === 0) {
            return null;
        }

        return {
            type: 'Feature',
            properties: {},
            geometry,
        };
    }, [geometry]);

    if (!maskFeature) {
        return null;
    }

    return (
        <>
            <Source id={MASK_SOURCE_ID} type="geojson" data={maskFeature}>
                <Layer
                    id={MASK_LAYER_ID}
                    type="fill"
                    beforeId={BELOW_ASSET_LAYER_ID}
                    paint={{
                        'fill-color': MASK_FILL_COLOUR,
                        'fill-opacity': MASK_FILL_OPACITY,
                    }}
                />
            </Source>
            {focusFeature && (
                <Source id={FOCUS_SOURCE_ID} type="geojson" data={focusFeature}>
                    <Layer
                        id={FOCUS_FILL_LAYER_ID}
                        type="fill"
                        beforeId={BELOW_ASSET_LAYER_ID}
                        paint={{
                            'fill-color': FOCUS_FILL_COLOUR,
                            'fill-outline-color': FOCUS_LINE_COLOUR,
                            'fill-opacity': FOCUS_FILL_OPACITY,
                        }}
                    />
                    <Layer
                        id={FOCUS_LINE_LAYER_ID}
                        type="line"
                        beforeId={BELOW_ASSET_LAYER_ID}
                        paint={{
                            'line-color': FOCUS_LINE_COLOUR,
                            'line-width': FOCUS_LINE_WIDTH,
                            'line-opacity': FOCUS_LINE_OPACITY,
                        }}
                    />
                </Source>
            )}
        </>
    );
};

export default FocusAreaMask;
