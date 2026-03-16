// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { FeatureCollection } from 'geojson';
import config from '@/config/app-config';

export type UtilityGroup = {
    readonly id: string;
    readonly name: string;
    readonly utilities: readonly Utility[];
};

export type Utility = {
    readonly id: string;
    readonly name: string;
};

export type UtilitiesResponse = {
    readonly groups: readonly UtilityGroup[];
};

export type Coordinate = {
    readonly lat: number;
    readonly lng: number;
};

export type RoadRouteInputParams = {
    readonly start: Coordinate;
    readonly end: Coordinate;
    readonly vehicle?: 'HGV' | 'EmergencyVehicle' | 'Car';
};

export type RouteEndpoint = {
    readonly name: string;
    readonly requested: Coordinate;
    readonly snapped: Coordinate;
    readonly snapDistanceFeet: number;
};

export type NoRouteProperties = {
    readonly hasRoute: false;
    readonly runtimeSeconds?: number;
};

export type SuccessRouteProperties = {
    readonly hasRoute: true;
    readonly distanceMiles: number;
    readonly durationMinutes: number;
    readonly averageSpeedMph: number;
    readonly runtimeSeconds?: number;
    readonly start: RouteEndpoint;
    readonly end: RouteEndpoint;
};

export type RoadRouteProperties = NoRouteProperties | SuccessRouteProperties;

export type RoadRouteResponse = FeatureCollection & {
    readonly properties?: RoadRouteProperties;
};

type ApiCoordinate = { lat: number; lon: number };

const toCoordinate = (c: ApiCoordinate): Coordinate => ({ lat: c.lat, lng: c.lon });

export const calculateRoute = async (scenarioId: string, params: RoadRouteInputParams): Promise<RoadRouteResponse> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/route/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            startLat: params.start.lat,
            startLon: params.start.lng,
            endLat: params.end.lat,
            endLon: params.end.lng,
            vehicle: params.vehicle,
        }),
    });
    if (!response.ok) {
        throw new Error(`Failed to calculate route: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.properties?.hasRoute) {
        const { start, end } = data.properties;
        return {
            ...data,
            properties: {
                ...data.properties,
                start: { ...start, requested: toCoordinate(start.requested), snapped: toCoordinate(start.snapped) },
                end: { ...end, requested: toCoordinate(end.requested), snapped: toCoordinate(end.snapped) },
            },
        };
    }

    return data as RoadRouteResponse;
};

export const fetchUtilities = async (): Promise<UtilitiesResponse> => {
    return {
        groups: [
            {
                id: 'route-planner',
                name: 'Route Planner',
                utilities: [
                    {
                        id: 'road-route',
                        name: 'Route',
                    },
                ],
            },
        ],
    };
};
