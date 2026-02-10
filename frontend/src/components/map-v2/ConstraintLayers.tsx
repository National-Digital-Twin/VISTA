import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import type { Feature, FeatureCollection } from 'geojson';
import { BELOW_ASSET_LAYER_ID } from './constants';
import type { ConstraintInterventionType } from '@/api/constraint-interventions';

const SOURCE_ID = 'constraint-interventions-source';
const FILL_LAYER_ID = 'constraint-interventions-fill-layer';
const LINE_LAYER_ID = 'constraint-interventions-line-layer';

const FILL_COLOUR = '#E67E22';
const FILL_OPACITY = 0.25;
const LINE_COLOUR = '#D35400';
const LINE_WIDTH = 2.5;
const LINE_OPACITY = 0.8;

type ConstraintLayersProps = {
    readonly constraintTypes?: ConstraintInterventionType[];
    readonly mapReady: boolean;
};

const ConstraintLayers = ({ constraintTypes, mapReady }: ConstraintLayersProps) => {
    const featureCollection: FeatureCollection = useMemo(() => {
        if (!constraintTypes) {
            return { type: 'FeatureCollection', features: [] };
        }

        const features: Feature[] = [];
        for (const ct of constraintTypes) {
            for (const intervention of ct.constraintInterventions) {
                if (!intervention.isActive || !intervention.geometry) {
                    continue;
                }
                features.push({
                    type: 'Feature',
                    properties: { id: intervention.id },
                    geometry: intervention.geometry,
                });
            }
        }

        return { type: 'FeatureCollection', features };
    }, [constraintTypes]);

    if (!mapReady || featureCollection.features.length === 0) {
        return null;
    }

    return (
        <Source id={SOURCE_ID} type="geojson" data={featureCollection}>
            <Layer
                id={FILL_LAYER_ID}
                type="fill"
                beforeId={BELOW_ASSET_LAYER_ID}
                filter={['==', '$type', 'Polygon']}
                paint={{
                    'fill-color': FILL_COLOUR,
                    'fill-opacity': FILL_OPACITY,
                }}
            />
            <Layer
                id={LINE_LAYER_ID}
                type="line"
                beforeId={BELOW_ASSET_LAYER_ID}
                paint={{
                    'line-color': LINE_COLOUR,
                    'line-width': LINE_WIDTH,
                    'line-opacity': LINE_OPACITY,
                }}
            />
        </Source>
    );
};

export default ConstraintLayers;
