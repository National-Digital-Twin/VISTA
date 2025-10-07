import type { LayerProps } from 'react-map-gl/maplibre';

const polygon: LayerProps = {
    id: 'flood-area-ploygon',
    type: 'fill',
    source: 'flood-areas',
    layout: {},
    paint: {
        'fill-color': '#059ec0',
        'fill-opacity': 0.4,
    },
};
const polygonOutline: LayerProps = {
    id: 'flood-area-outline',
    type: 'line',
    source: 'flood-areas',
    layout: {},
    paint: {
        'line-color': ['case', ['boolean', ['feature-state', 'selected'], false], '#D0D0D0', '#04345c'],
        'line-width': 2,
    },
};

const FLOOD_AREA_LAYERS = [polygon, polygonOutline];
export const FLOOD_AREA_POLYGON_ID = polygon.id;
export const FLOOD_AREA_POLYGON_OUTLINE_ID = polygonOutline.id;
export default FLOOD_AREA_LAYERS;
