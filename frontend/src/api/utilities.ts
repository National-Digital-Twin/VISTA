import type { FeatureCollection, Geometry } from 'geojson';
import { useLazyQuery } from '@apollo/client/react';
import type { QueryHookOptions } from '@apollo/client/react';
import { GET_ROAD_ROUTE } from './apollo-client';

export type UtilityGroup = {
    readonly id: string;
    readonly name: string;
    readonly utilities: readonly Utility[];
};

export type Utility = {
    readonly id: string;
    readonly name: string;
    readonly geometry: Geometry;
};

export type UtilitiesResponse = {
    readonly featureCollection: FeatureCollection;
    readonly groups: readonly UtilityGroup[];
};

export type RoadRoute = {
    readonly routeGeojson: FeatureCollection;
};

export type RoadRouteResponse = {
    readonly roadRoute: RoadRoute;
};

export type RoadRouteInputParams = {
    readonly startLat: number;
    readonly startLon: number;
    readonly endLat: number;
    readonly endLon: number;
    readonly floodExtent?: FeatureCollection;
    readonly vehicle?: 'HGV' | 'EmergencyVehicle' | 'Car';
};

export const useRoadRouteLazyQuery = (options?: Omit<QueryHookOptions<RoadRouteResponse, RoadRouteInputParams>, 'query'>) =>
    useLazyQuery<RoadRouteResponse, RoadRouteInputParams>(GET_ROAD_ROUTE, options);

export const fetchUtilities = async (): Promise<UtilitiesResponse> => {
    return {
        featureCollection: {
            type: 'FeatureCollection',
            features: [],
        },
        groups: [
            {
                id: 'route-planner',
                name: 'Route Planner',
                utilities: [
                    {
                        id: 'road-route',
                        name: 'Route',
                        geometry: {
                            type: 'LineString',
                            coordinates: [],
                        },
                    },
                ],
            },
        ],
    };
};
