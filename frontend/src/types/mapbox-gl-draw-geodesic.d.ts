// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

declare module 'mapbox-gl-draw-geodesic' {
    import type { Feature, Geometry, GeoJsonProperties } from 'geojson';

    export function isCircle(feature: Feature<Geometry, GeoJsonProperties>): boolean;
    export function getCircleCenter(feature: Feature<Geometry, GeoJsonProperties>): [number, number];
}
