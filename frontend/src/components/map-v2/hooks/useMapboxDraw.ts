import MapboxDraw from '@mapbox/mapbox-gl-draw';
import type { IControl } from 'maplibre-gl';
import { useEffect, useRef, type RefObject } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import type { FeatureType } from '../constants';
import { CircleMode, DragCircleMode } from '@/vendor/mapbox-gl-draw-circle';

type StyleType = 'fill' | 'line' | 'circle' | 'symbol' | 'raster' | 'background';

type DrawStyle = {
    id: string;
    type: StyleType;
    filter?: unknown[];
    layout?: Record<string, unknown>;
    paint?: Record<string, unknown>;
};

export type ActiveFeatureType = FeatureType;

const COLORS = {
    focus_area: { fill: '#FF0C0C', stroke: '#FF0C0C', fillOpacity: 0.2 },
    exposure_layer: { fill: '#4A90E2', stroke: '#2E5C8A', fillOpacity: 0.3 },
} as const;

const DEFAULT_COLORS = { fill: '#333333', stroke: '#1a1a1a', fillOpacity: 0.2 };

const createDrawStyles = (activeFeatureType: ActiveFeatureType | null): DrawStyle[] => {
    const colors = activeFeatureType ? COLORS[activeFeatureType] : DEFAULT_COLORS;

    return [
        {
            id: 'gl-draw-line',
            type: 'line',
            filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
            layout: {
                'line-cap': 'round',
                'line-join': 'round',
            },
            paint: {
                'line-color': colors.stroke,
                'line-dasharray': [2, 2],
                'line-width': 2,
            },
        },
        {
            id: 'gl-draw-polygon-fill',
            type: 'fill',
            filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            paint: {
                'fill-color': colors.fill,
                'fill-outline-color': colors.stroke,
                'fill-opacity': colors.fillOpacity,
            },
        },
        {
            id: 'gl-draw-polygon-midpoint',
            type: 'circle',
            filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
            paint: {
                'circle-radius': 3,
                'circle-color': colors.stroke,
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
                'line-color': colors.stroke,
                'line-dasharray': [0.2, 2],
                'line-width': 2,
            },
        },
        {
            id: 'gl-draw-polygon-and-line-vertex-halo-active',
            type: 'circle',
            filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
            paint: {
                'circle-radius': 5,
                'circle-color': '#FFFFFF',
            },
        },
        {
            id: 'gl-draw-polygon-and-line-vertex-active',
            type: 'circle',
            filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
            paint: {
                'circle-radius': 3,
                'circle-color': colors.stroke,
            },
        },
    ];
};

const getDrawConfig = (activeFeatureType: ActiveFeatureType | null) => ({
    displayControlsDefault: false,
    styles: createDrawStyles(activeFeatureType),
    touchEnabled: true,
    touchMoveThreshold: 3,
    clickBuffer: 3,
    keybindings: true,
    boxSelect: false,
    touchPitch: false,
    mode: 'simple_select',
    modes: {
        ...MapboxDraw.modes,
        draw_circle: CircleMode,
        drag_circle: DragCircleMode,
    },
});

type UseMapboxDrawOptions = {
    mapRef: RefObject<MapRef | null>;
    isReady: boolean;
    activeFeatureType?: ActiveFeatureType | null;
    onDrawReady?: (ready: boolean) => void;
};

const useMapboxDraw = ({ mapRef, isReady, activeFeatureType = null, onDrawReady }: UseMapboxDrawOptions): RefObject<MapboxDraw | null> => {
    const drawRef = useRef<MapboxDraw | null>(null);

    useEffect(() => {
        if (!isReady || !mapRef.current) {
            return;
        }

        const map = mapRef.current.getMap?.();
        if (!map) {
            return;
        }

        const currentDraw = drawRef.current;

        if (currentDraw) {
            const features = currentDraw.getAll();
            map.removeControl(currentDraw as unknown as IControl);
            drawRef.current = null;

            const newDraw = new MapboxDraw(getDrawConfig(activeFeatureType));
            map.addControl(newDraw as unknown as IControl);
            drawRef.current = newDraw;

            if (features.features.length > 0) {
                newDraw.set(features);
            }
            return;
        }

        const newDraw = new MapboxDraw(getDrawConfig(activeFeatureType));
        map.addControl(newDraw as unknown as IControl);
        drawRef.current = newDraw;
        onDrawReady?.(true);

        return () => {
            onDrawReady?.(false);
            try {
                map.removeControl(newDraw as unknown as IControl);
            } catch {
                void 0;
            }
            drawRef.current = null;
        };
    }, [isReady, mapRef, activeFeatureType, onDrawReady]);

    return drawRef;
};

export default useMapboxDraw;
