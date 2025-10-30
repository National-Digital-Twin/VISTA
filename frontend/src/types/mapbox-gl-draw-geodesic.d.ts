declare module 'mapbox-gl-draw-geodesic' {
    import type { Feature, Geometry, GeoJsonProperties } from 'geojson';

    export function isCircle(feature: Feature<Geometry, GeoJsonProperties>): boolean;
    export function getCircleCenter(feature: Feature<Geometry, GeoJsonProperties>): [number, number];
}
