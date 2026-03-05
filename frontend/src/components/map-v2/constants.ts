// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { ViewState } from 'react-map-gl';
import config from '@/config/app-config';

export type MapStyleKey = 'os' | 'streets' | 'satellite' | 'basic' | 'bright';

function createMapTilerStyle(styleId: string): string {
    const token = config.map.maptilerToken;
    if (!token || token === 'undefined' || token === '' || token === 'null') {
        return `${styleId}?key=`;
    }
    return `${styleId}?key=${token}`;
}

export type MapStyle = {
    id: string;
    name: string;
    key: MapStyleKey;
};

export const MAP_STYLES: Record<MapStyleKey, string> = {
    os: 'https://api.os.uk/maps/vector/v1/vts/resources/styles?srs=3857',
    streets: createMapTilerStyle('https://api.maptiler.com/maps/streets-v2/style.json'),
    satellite: createMapTilerStyle('https://api.maptiler.com/maps/hybrid/style.json'),
    basic: createMapTilerStyle('https://api.maptiler.com/maps/basic-v2/style.json'),
    bright: createMapTilerStyle('https://api.maptiler.com/maps/bright-v2/style.json'),
};

export const MAP_STYLE_OPTIONS: readonly MapStyle[] = [
    { id: MAP_STYLES.os, name: 'Ordnance Survey', key: 'os' },
    { id: MAP_STYLES.streets, name: 'Streets', key: 'streets' },
    { id: MAP_STYLES.satellite, name: 'Satellite', key: 'satellite' },
    { id: MAP_STYLES.basic, name: 'Basic', key: 'basic' },
    { id: MAP_STYLES.bright, name: 'Bright', key: 'bright' },
];

export const DEFAULT_MAP_STYLE: MapStyleKey = 'os';

export const DEFAULT_VIEW_STATE: ViewState = {
    longitude: -1.3,
    latitude: 50.7,
    zoom: 10.5,
    pitch: 0,
    bearing: 0,
};

export const MAP_VIEW_BOUNDS: [[number, number], [number, number]] = [
    [-25, 42],
    [15, 67],
];

export const FEATURE_TYPES = {
    FOCUS_AREA: 'focus_area',
    EXPOSURE_LAYER: 'exposure_layer',
    CONSTRAINT: 'constraint',
} as const;

export type FeatureType = (typeof FEATURE_TYPES)[keyof typeof FEATURE_TYPES];

export const ROUTE_START_COLOR = '#4CAF50';
export const ROUTE_END_COLOR = '#F44336';

export const BELOW_ASSET_LAYER_ID = 'map-v2-below-asset-slot';
