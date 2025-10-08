import { booleanIntersects, booleanPointInPolygon, circle as turfCircle } from '@turf/turf';
import type { Feature, GeoJsonProperties, Geometry, MultiPolygon, Polygon } from 'geojson';
import { getCircleCenter, isCircle } from 'mapbox-gl-draw-geodesic';
import { isEmpty } from '@/utils/isEmpty';
import { findElement, getUniqueElements } from '@/utils';

export default function useElementsInPolygons() {
    const findElementsInPolygons = ({ target, polygons, assets, dependencies }: { target: any; polygons: any; assets: any; dependencies: any }) => {
        const pointAssets: Feature<Geometry, GeoJsonProperties>[] = target.getSource('point-assets')._data.features;
        const points = pointAssets.filter((feature) => feature.geometry.type === 'Point');
        const pointsInPolygon = findPointsInPolygon(polygons, points);

        const connectedDependencies = pointAssets
            .filter((feature) => feature.geometry.type === 'LineString')
            .filter((feature) => {
                const isConnected = pointsInPolygon.some((point) => {
                    const isDependent = point.properties?.uri === feature.properties?.dependent;
                    const isProvider = point.properties?.uri === feature.properties?.provider;
                    return isDependent || isProvider;
                });
                return isConnected;
            });

        const connectedAssets = connectedDependencies.map((feature) => {
            const isDependent = pointsInPolygon.some((pointFeature) => pointFeature.properties?.uri === feature.properties?.dependent);
            if (isDependent) {
                return points.find((point) => point.properties?.uri === feature.properties?.provider);
            }
            return points.find((point) => point.properties?.uri === feature.properties?.dependent);
        });

        const linearAssets = target.getSource('linear-assets')._data.features;
        const LAIntersectingPolygon = findLinesIntersectingPolygon(polygons, linearAssets);

        const elements = [...pointsInPolygon, ...connectedAssets, ...LAIntersectingPolygon, ...connectedDependencies]
            .map((element) => {
                return element?.properties?.uri ? findElement([...assets, ...dependencies], element.properties.uri) : null;
            })
            .filter(Boolean);

        return getUniqueElements(elements);
    };

    return { findElementsInPolygons };
}

function getPolygon(feature: Feature<Geometry, GeoJsonProperties>): Feature<Polygon | MultiPolygon, GeoJsonProperties> {
    if (isCircle(feature)) {
        const center = getCircleCenter(feature);
        const radius = Number.parseFloat(Math.fround(feature.properties?.circleRadius || 0).toFixed(3));

        const circle = turfCircle(center, radius, {
            steps: 50,
            units: 'kilometers',
            properties: { center, radius },
        });
        return circle;
    }
    return feature as Feature<Polygon | MultiPolygon, GeoJsonProperties>;
}

function findPointsInPolygon(polygonFeatures: Feature<Geometry, GeoJsonProperties>[], points: Feature<Geometry, GeoJsonProperties>[]) {
    if (isEmpty(polygonFeatures)) {
        return [];
    }

    return points.filter((point) => {
        if (point.geometry.type === 'Point') {
            return polygonFeatures.some((polygon) => booleanPointInPolygon((point.geometry as any).coordinates, getPolygon(polygon)));
        }
        return false;
    });
}

function findLinesIntersectingPolygon(polygonFeatures: Feature<Geometry, GeoJsonProperties>[], lineStringFeatures: Feature<Geometry, GeoJsonProperties>[]) {
    if (isEmpty(polygonFeatures)) {
        return [];
    }

    return lineStringFeatures.filter((lineString) => polygonFeatures.some((polygon) => booleanIntersects(getPolygon(polygon), lineString)));
}
