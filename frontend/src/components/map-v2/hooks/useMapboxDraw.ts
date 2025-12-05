import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useEffect, useRef, type MutableRefObject, type RefObject } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import { CircleMode, DragCircleMode } from '@/vendor/mapbox-gl-draw-circle';

type StyleType = 'fill' | 'line' | 'circle' | 'symbol' | 'raster' | 'background';

type DrawStyle = {
    id: string;
    type: StyleType;
    filter?: (string | number | boolean | (string | number | boolean)[])[];
    layout?: Record<string, string | number | boolean>;
    paint?: Record<string, string | number | boolean | (string | number)[]>;
};

const DRAW_STYLES: readonly DrawStyle[] = [
    {
        id: 'gl-draw-line',
        type: 'line',
        filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
        layout: {
            'line-cap': 'round',
            'line-join': 'round',
        },
        paint: {
            'line-color': '#3bb2d0',
            'line-dasharray': [0.2, 2],
            'line-width': 2,
        },
    },
    {
        id: 'gl-draw-polygon-fill',
        type: 'fill',
        filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
        paint: {
            'fill-color': '#3bb2d0',
            'fill-outline-color': '#3bb2d0',
            'fill-opacity': 0.1,
        },
    },
    {
        id: 'gl-draw-polygon-midpoint',
        type: 'circle',
        filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
        paint: {
            'circle-radius': 3,
            'circle-color': '#3bb2d0',
        },
    },
    {
        id: 'gl-draw-polygon-stroke-active',
        type: 'line',
        filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
        layout: {
            'line-cap': 'round',
            'line-join': 'round',
        },
        paint: {
            'line-color': '#3bb2d0',
            'line-dasharray': [0.2, 2],
            'line-width': 2,
        },
    },
    {
        id: 'gl-draw-polygon-stroke-inactive',
        type: 'line',
        filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
        layout: {
            'line-cap': 'round',
            'line-join': 'round',
        },
        paint: {
            'line-color': '#3bb2d0',
            'line-width': 2,
            'line-dasharray': [0.2, 2],
        },
    },
    {
        id: 'gl-draw-polygon-and-line-vertex-halo-active',
        type: 'circle',
        filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
        paint: {
            'circle-radius': 5,
            'circle-color': '#FFF',
        },
    },
    {
        id: 'gl-draw-polygon-and-line-vertex-active',
        type: 'circle',
        filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
        paint: {
            'circle-radius': 3,
            'circle-color': '#3bb2d0',
        },
    },
];

const DRAW_CONFIG = {
    displayControlsDefault: false,
    styles: DRAW_STYLES,
    touchEnabled: true,
    touchMoveThreshold: 3,
    clickBuffer: 3,
    keybindings: false,
    boxSelect: false,
    touchPitch: false,
    mode: 'simple_select',
    modes: {
        ...MapboxDraw.modes,
        draw_circle: CircleMode,
        drag_circle: DragCircleMode,
    },
};

const useMapboxDraw = (mapRef: RefObject<MapRef | null>, isReady: boolean): MutableRefObject<MapboxDraw | null> => {
    const drawRef = useRef<MapboxDraw | null>(null);

    useEffect(() => {
        if (!isReady || !mapRef.current || drawRef.current) {
            return;
        }

        const map = mapRef.current.getMap();
        const draw = new MapboxDraw(DRAW_CONFIG);

        map.addControl(draw);
        drawRef.current = draw;
    }, [isReady, mapRef]);

    return drawRef;
};

export default useMapboxDraw;
