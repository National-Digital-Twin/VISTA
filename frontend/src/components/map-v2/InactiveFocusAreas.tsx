import type { Feature, FeatureCollection } from 'geojson';
import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import { BELOW_ASSET_LAYER_ID } from './constants';
import type { FocusArea } from '@/api/focus-areas';

const SOURCE_ID = 'inactive-focus-areas-source';
const LINE_LAYER_ID = 'inactive-focus-areas-line-layer';

const INACTIVE_LINE_COLOUR = '#666666';
const INACTIVE_LINE_WIDTH = 2;
const SELECTED_INACTIVE_LINE_COLOUR = '#888888';
const SELECTED_INACTIVE_LINE_WIDTH = 2;

type InactiveFocusAreasProps = {
    readonly focusAreas: FocusArea[];
    readonly selectedFocusAreaId?: string | null;
};

const InactiveFocusAreas = ({ focusAreas, selectedFocusAreaId }: InactiveFocusAreasProps) => {
    const featureCollection = useMemo((): FeatureCollection => {
        const features: Feature[] = [];

        for (const focusArea of focusAreas) {
            if (!focusArea.geometry || (focusArea.geometry.type !== 'Polygon' && focusArea.geometry.type !== 'MultiPolygon')) {
                continue;
            }

            const isSelected = focusArea.id === selectedFocusAreaId;
            const feature: Feature = {
                type: 'Feature',
                properties: {
                    id: focusArea.id,
                    isSelected,
                    isActive: focusArea.isActive,
                },
                geometry: focusArea.geometry,
            };
            features.push(feature);
        }

        return {
            type: 'FeatureCollection',
            features,
        };
    }, [focusAreas, selectedFocusAreaId]);

    if (featureCollection.features.length === 0) {
        return null;
    }

    return (
        <Source id={SOURCE_ID} type="geojson" data={featureCollection} generateId>
            <Layer
                id={LINE_LAYER_ID}
                type="line"
                beforeId={BELOW_ASSET_LAYER_ID}
                paint={{
                    'line-color': ['case', ['get', 'isSelected'], SELECTED_INACTIVE_LINE_COLOUR, INACTIVE_LINE_COLOUR],
                    'line-width': ['case', ['get', 'isSelected'], SELECTED_INACTIVE_LINE_WIDTH, INACTIVE_LINE_WIDTH],
                    'line-dasharray': [2, 2],
                }}
            />
        </Source>
    );
};

export default InactiveFocusAreas;
