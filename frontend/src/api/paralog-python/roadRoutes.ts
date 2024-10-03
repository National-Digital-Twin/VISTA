import type { Feature, FeatureCollection, Polygon } from "geojson";
import { QueryOptions, useLazyQuery } from "@apollo/client";
import { GET_ROAD_ROUTE } from "../apollo-client";

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
  vehicle: "HGV" | "EmergencyVehicle" | "Car";
}

export const useRoadRouteLazyQuery = (
  options?: Omit<QueryOptions<RoadRouteInputParams, RoadRoute>, "query">,
) =>
  useLazyQuery<RoadRouteResponse, RoadRouteInputParams>(
    GET_ROAD_ROUTE,
    options,
  );
