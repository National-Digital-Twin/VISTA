import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import type { Geometry, Position } from 'geojson';

const SOURCE_ID = 'focus-area-mask-source';
const LAYER_ID = 'focus-area-mask-layer';
const MASK_FILL_COLOUR = '#000000';
const MASK_FILL_OPACITY = 0.4;

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

    if (!maskFeature) {
        return null;
    }

    return (
        <Source id={SOURCE_ID} type="geojson" data={maskFeature}>
            <Layer
                id={LAYER_ID}
                type="fill"
                paint={{
                    'fill-color': MASK_FILL_COLOUR,
                    'fill-opacity': MASK_FILL_OPACITY,
                }}
            />
        </Source>
    );
};

export default FocusAreaMask;
