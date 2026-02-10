import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import type { Feature, FeatureCollection, Position } from 'geojson';
import { BELOW_ASSET_LAYER_ID } from './constants';
import type { FocusArea } from '@/api/focus-areas';

const WORLD_BOUNDS: Position[] = [
    [-180, -90],
    [-180, 90],
    [180, 90],
    [180, -90],
    [-180, -90],
];

const MASK_SOURCE_ID = 'active-focus-areas-mask-source';
const MASK_LAYER_ID = 'active-focus-areas-mask-layer';
const FOCUS_SOURCE_ID = 'active-focus-areas-highlight-source';
const FOCUS_FILL_LAYER_ID = 'active-focus-areas-highlight-fill-layer';
const FOCUS_LINE_LAYER_ID = 'active-focus-areas-highlight-line-layer';

const MASK_FILL_COLOUR = '#000000';
const MASK_FILL_OPACITY = 0.4;
const ACTIVE_FOCUS_FILL_COLOUR = '#666666';
const ACTIVE_FOCUS_FILL_OPACITY = 0.1;
const ACTIVE_FOCUS_LINE_COLOUR = '#666666';
const ACTIVE_FOCUS_LINE_WIDTH = 2;
const ACTIVE_FOCUS_LINE_OPACITY = 0.6;

const SELECTED_FOCUS_FILL_COLOUR = '#FF0C0C';
const SELECTED_FOCUS_FILL_OPACITY = 0.2;
const SELECTED_FOCUS_LINE_COLOUR = '#FF0C0C';
const SELECTED_FOCUS_LINE_WIDTH = 2;
const SELECTED_FOCUS_LINE_OPACITY = 0.6;

function reverseCoordinates(coords: Position[]): Position[] {
    return [...coords].reverse();
}

type ActiveFocusAreasProps = {
    readonly focusAreas: FocusArea[];
    readonly selectedFocusAreaId?: string | null;
    readonly showMask?: boolean;
};

const ActiveFocusAreas = ({ focusAreas, selectedFocusAreaId, showMask = false }: ActiveFocusAreasProps) => {
    const focusAreasWithGeometry = useMemo(() => {
        return focusAreas.filter((fa) => fa.geometry !== null);
    }, [focusAreas]);

    const activeFocusAreasWithGeometry = useMemo(() => {
        return focusAreasWithGeometry.filter((fa) => fa.isActive);
    }, [focusAreasWithGeometry]);

    const maskFeature = useMemo(() => {
        if (!showMask || activeFocusAreasWithGeometry.length === 0) {
            return null;
        }

        const firstFocusArea = activeFocusAreasWithGeometry[0];
        if (firstFocusArea.geometry?.type !== 'Polygon') {
            return null;
        }

        const outerRing = (firstFocusArea.geometry.coordinates as Position[][])[0];
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
    }, [showMask, activeFocusAreasWithGeometry]);

    const focusFeatures = useMemo((): Feature[] => {
        const features: Feature[] = [];

        for (const focusArea of activeFocusAreasWithGeometry) {
            if (focusArea.geometry?.type !== 'Polygon') {
                continue;
            }

            const outerRing = (focusArea.geometry.coordinates as Position[][])[0];
            if (!outerRing || outerRing.length === 0) {
                continue;
            }

            const isSelected = focusArea.id === selectedFocusAreaId;

            features.push({
                type: 'Feature' as const,
                properties: {
                    id: focusArea.id,
                    isSelected,
                    isActive: true,
                },
                geometry: focusArea.geometry,
            });
        }

        return features;
    }, [activeFocusAreasWithGeometry, selectedFocusAreaId]);

    const featureCollection: FeatureCollection = useMemo(
        () => ({
            type: 'FeatureCollection',
            features: focusFeatures,
        }),
        [focusFeatures],
    );

    if (activeFocusAreasWithGeometry.length === 0) {
        return null;
    }

    return (
        <>
            {showMask && maskFeature && (
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
            )}
            {featureCollection.features.length > 0 && (
                <Source id={FOCUS_SOURCE_ID} type="geojson" data={featureCollection} generateId>
                    <Layer
                        id={FOCUS_FILL_LAYER_ID}
                        type="fill"
                        beforeId={BELOW_ASSET_LAYER_ID}
                        paint={{
                            'fill-color': ['case', ['get', 'isSelected'], SELECTED_FOCUS_FILL_COLOUR, ACTIVE_FOCUS_FILL_COLOUR],
                            'fill-opacity': ['case', ['get', 'isSelected'], SELECTED_FOCUS_FILL_OPACITY, ACTIVE_FOCUS_FILL_OPACITY],
                        }}
                    />
                    <Layer
                        id={FOCUS_LINE_LAYER_ID}
                        type="line"
                        beforeId={BELOW_ASSET_LAYER_ID}
                        paint={{
                            'line-color': ['case', ['get', 'isSelected'], SELECTED_FOCUS_LINE_COLOUR, ACTIVE_FOCUS_LINE_COLOUR],
                            'line-width': ['case', ['get', 'isSelected'], SELECTED_FOCUS_LINE_WIDTH, ACTIVE_FOCUS_LINE_WIDTH],
                            'line-opacity': ['case', ['get', 'isSelected'], SELECTED_FOCUS_LINE_OPACITY, ACTIVE_FOCUS_LINE_OPACITY],
                        }}
                    />
                </Source>
            )}
        </>
    );
};

export default ActiveFocusAreas;
