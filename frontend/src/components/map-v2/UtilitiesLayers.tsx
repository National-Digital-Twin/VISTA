// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { findIconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Box } from '@mui/material';
import type { FeatureCollection } from 'geojson';
import { useMemo } from 'react';
import { Layer, Marker, Source } from 'react-map-gl/maplibre';
import { ROUTE_START_COLOR, ROUTE_END_COLOR, BELOW_ASSET_LAYER_ID } from './constants';
import { useRouteContext } from './context/RouteContext';
import type { SuccessRouteProperties } from '@/api/utilities';

const SOURCE_ID = 'map-v2-utilities-source';
const LAYER_ID = 'map-v2-utilities-layer';
const WALK_LINES_SOURCE_ID = 'map-v2-walk-lines-source';
const WALK_LINES_LAYER_ID = 'map-v2-walk-lines-layer';
const DIRECT_LINE_SOURCE_ID = 'map-v2-direct-line-source';
const DIRECT_LINE_LAYER_ID = 'map-v2-direct-line-layer';
const DEFAULT_LINE_COLOR = '#FF6B35';
const DEFAULT_LINE_WIDTH = 3;
const DEFAULT_LINE_OPACITY = 0.8;

const MARKER_STYLE = {
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: '2px solid white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
} as const;

type UtilitiesLayersProps = {
    readonly mapReady?: boolean;
};

const UtilitiesLayers = ({ mapReady }: UtilitiesLayersProps) => {
    const { routeData, showAdditionalSummary, showDirectLine, start, end } = useRouteContext();

    const hasRoute = routeData?.properties?.hasRoute === true;
    const routeProps = hasRoute ? (routeData!.properties as SuccessRouteProperties) : null;

    const routeFeatures = useMemo(() => {
        if (!hasRoute || !routeData?.features) {
            return [];
        }
        return routeData.features;
    }, [routeData, hasRoute]);

    const featureCollection: FeatureCollection = useMemo(
        () => ({
            type: 'FeatureCollection',
            features: routeFeatures,
        }),
        [routeFeatures],
    );

    const walkLinesCollection: FeatureCollection = useMemo(() => {
        if (!showAdditionalSummary || !routeProps) {
            return { type: 'FeatureCollection', features: [] };
        }

        const { start, end } = routeProps;
        const features = [];
        const trim = 0.1; // avoid line overlapping with the markers

        if (start.snapDistanceFeet > 3) {
            const dLng = start.snapped.lng - start.requested.lng;
            const dLat = start.snapped.lat - start.requested.lat;
            features.push({
                type: 'Feature' as const,
                properties: { type: 'walk-line' },
                geometry: {
                    type: 'LineString' as const,
                    coordinates: [
                        [start.requested.lng + dLng * trim, start.requested.lat + dLat * trim],
                        [start.snapped.lng - dLng * trim, start.snapped.lat - dLat * trim],
                    ],
                },
            });
        }

        if (end.snapDistanceFeet > 3) {
            const dLng = end.requested.lng - end.snapped.lng;
            const dLat = end.requested.lat - end.snapped.lat;
            features.push({
                type: 'Feature' as const,
                properties: { type: 'walk-line' },
                geometry: {
                    type: 'LineString' as const,
                    coordinates: [
                        [end.snapped.lng + dLng * trim, end.snapped.lat + dLat * trim],
                        [end.requested.lng - dLng * trim, end.requested.lat - dLat * trim],
                    ],
                },
            });
        }

        return { type: 'FeatureCollection' as const, features };
    }, [routeProps, showAdditionalSummary]);

    const directLineCollection: FeatureCollection = useMemo(() => {
        if (!showDirectLine || !routeProps) {
            return { type: 'FeatureCollection', features: [] };
        }
        const { start, end } = routeProps;
        return {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature' as const,
                    properties: { type: 'direct-line' },
                    geometry: {
                        type: 'LineString' as const,
                        coordinates: [
                            [start.snapped.lng, start.snapped.lat],
                            [end.snapped.lng, end.snapped.lat],
                        ],
                    },
                },
            ],
        };
    }, [showDirectLine, routeProps]);

    const locationDotPath = useMemo(() => {
        const iconDef = findIconDefinition({ prefix: 'fas', iconName: 'location-dot' });
        const pathData = iconDef?.icon?.[4];
        return Array.isArray(pathData) ? pathData[0] : pathData;
    }, []);

    if (!mapReady) {
        return null;
    }

    return (
        <>
            {routeFeatures.length > 0 && (
                <Source id={SOURCE_ID} type="geojson" data={featureCollection}>
                    <Layer
                        id={LAYER_ID}
                        type="line"
                        beforeId={BELOW_ASSET_LAYER_ID}
                        paint={{
                            'line-color': DEFAULT_LINE_COLOR,
                            'line-width': DEFAULT_LINE_WIDTH,
                            'line-opacity': DEFAULT_LINE_OPACITY,
                        }}
                    />
                </Source>
            )}
            {directLineCollection.features.length > 0 && (
                <Source id={DIRECT_LINE_SOURCE_ID} type="geojson" data={directLineCollection}>
                    <Layer
                        id={DIRECT_LINE_LAYER_ID}
                        type="line"
                        beforeId={BELOW_ASSET_LAYER_ID}
                        paint={{
                            'line-color': '#666666',
                            'line-width': 2,
                            'line-opacity': 0.8,
                            'line-dasharray': [4, 4],
                        }}
                    />
                </Source>
            )}
            {walkLinesCollection.features.length > 0 && (
                <Source id={WALK_LINES_SOURCE_ID} type="geojson" data={walkLinesCollection}>
                    <Layer
                        id={WALK_LINES_LAYER_ID}
                        type="line"
                        beforeId={BELOW_ASSET_LAYER_ID}
                        paint={{
                            'line-color': DEFAULT_LINE_COLOR,
                            'line-width': 2,
                            'line-opacity': 0.8,
                            'line-dasharray': [4, 4],
                        }}
                    />
                </Source>
            )}
            {showAdditionalSummary && start && hasRoute && routeProps && routeProps.start.snapDistanceFeet > 3 && (
                <Marker longitude={start.lng} latitude={start.lat} anchor="bottom">
                    <svg width="16" height="22" viewBox="-24 -24 432 560" xmlns="http://www.w3.org/2000/svg">
                        <path d={locationDotPath || ''} fill="none" stroke={ROUTE_START_COLOR} strokeWidth="40" />
                    </svg>
                </Marker>
            )}
            {showAdditionalSummary && end && hasRoute && routeProps && routeProps.end.snapDistanceFeet > 3 && (
                <Marker longitude={end.lng} latitude={end.lat} anchor="bottom">
                    <svg width="16" height="22" viewBox="-24 -24 432 560" xmlns="http://www.w3.org/2000/svg">
                        <path d={locationDotPath || ''} fill="none" stroke={ROUTE_END_COLOR} strokeWidth="40" />
                    </svg>
                </Marker>
            )}
            {[
                {
                    pos: routeProps?.start.snapped ?? start,
                    color: ROUTE_START_COLOR,
                    label: 'S',
                },
                {
                    pos: routeProps?.end.snapped ?? end,
                    color: ROUTE_END_COLOR,
                    label: 'E',
                },
            ].map(({ pos, color, label }) =>
                pos ? (
                    <Marker key={label} longitude={pos.lng} latitude={pos.lat} anchor="bottom">
                        <Box sx={{ ...MARKER_STYLE, backgroundColor: color }}>{label}</Box>
                    </Marker>
                ) : null,
            )}
        </>
    );
};

export default UtilitiesLayers;
