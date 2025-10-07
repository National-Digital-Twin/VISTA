import type { Feature, FeatureCollection, Polygon } from 'geojson';
import { useLazyQuery, type QueryHookOptions } from '@apollo/client/react';
import { GET_ROAD_ROUTE } from '../apollo-client';

export interface RoadRoute {
    navigationSteps?: string;
    routeGeojson: Feature;
}

export interface RoadRouteResponse {
    roadRoute: RoadRoute;
}

export interface RoadRouteInputParams {
    startLat: number;
    startLon: number;
    endLat: number;
    endLon: number;
    floodExtent: FeatureCollection<Polygon>;
    vehicle: 'HGV' | 'EmergencyVehicle' | 'Car';
}

export const useRoadRouteLazyQuery = (options?: Omit<QueryHookOptions<RoadRouteResponse, RoadRouteInputParams>, 'query'>) =>
    useLazyQuery<RoadRouteResponse, RoadRouteInputParams>(GET_ROAD_ROUTE, options);
