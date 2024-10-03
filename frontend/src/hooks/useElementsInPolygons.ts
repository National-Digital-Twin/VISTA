import { isCircle, getCircleCenter } from "mapbox-gl-draw-geodesic";
import type { MapboxGeoJSONFeature } from "react-map-gl";
import {
  circle as turfCircle,
  booleanPointInPolygon,
  booleanIntersects,
} from "@turf/turf";
import { isEmpty } from "@/utils/isEmpty";
import { findElement, getUniqueElements } from "@/utils";

export default function useElementsInPolygons() {
  const findElementsInPolygons = ({
    target,
    polygons,
    assets,
    dependencies,
  }) => {
    const pointAssets: MapboxGeoJSONFeature[] =
      target.getSource("point-assets")._data.features;
    const points = pointAssets.filter(
      (feature) => feature.geometry.type === "Point",
    );
    const pointsInPolygon = findPointsInPolygon(polygons, points);

    const connectedDependencies = pointAssets
      .filter((feature) => feature.geometry.type === "LineString")
      .filter((feature) => {
        const isConnected = pointsInPolygon.some((point) => {
          const isDependent =
            point.properties.uri === feature.properties.dependent;
          const isProvider =
            point.properties.uri === feature.properties.provider;
          return isDependent || isProvider;
        });
        return isConnected;
      });

    const connectedAssets = connectedDependencies.map((feature) => {
      const isDependent = pointsInPolygon.some(
        (pointFeature) =>
          pointFeature.properties.uri === feature.properties.dependent,
      );
      if (isDependent) {
        const providerAsset = points.find(
          (point) => point.properties.uri === feature.properties.provider,
        );
        return providerAsset;
      }
      const dependentAsset = points.find(
        (point) => point.properties.uri === feature.properties.dependent,
      );
      return dependentAsset;
    });

    // Alecs - Leaving this in for now until Tom gives the go ahead to remove this feature
    // const pointAssetDependecies = target.getSource("point-asset-dependecies")._data.features;
    // const PADIntersectingPolygon = findLinesIntersectingPolygon(polygons, pointAssetDependecies);

    const linearAssets = target.getSource("linear-assets")._data.features;
    const LAIntersectingPolygon = findLinesIntersectingPolygon(
      polygons,
      linearAssets,
    );

    const elements = [
      ...pointsInPolygon,
      ...connectedAssets,
      ...LAIntersectingPolygon,
      ...connectedDependencies,
    ].map((element) => {
      return findElement([...assets, ...dependencies], element.properties.uri);
    });

    const uniqueElements = getUniqueElements(elements);
    return uniqueElements;
  };
  return { findElementsInPolygons };
}

function getPolygon(feature: MapboxGeoJSONFeature) {
  if (isCircle(feature)) {
    const center = getCircleCenter(feature);
    const radius = parseFloat(
      Math.fround(feature.properties.circleRadius).toFixed(3),
    );
    feature.properties = {
      ...feature.properties,
      center,
      radius,
    };

    const circle = turfCircle(center, radius, {
      steps: 50,
      units: "kilometers",
      properties: { center, radius },
    });
    return circle;
  }
  return feature;
}

function findPointsInPolygon(polygonFeatures, points) {
  const pointsInPolygon = [];

  if (isEmpty(polygonFeatures)) {
    return pointsInPolygon;
  }

  for (let polygon of polygonFeatures) {
    polygon = getPolygon(polygon);
    for (const point of points) {
      const isPointInPolygon = booleanPointInPolygon(point, polygon);
      if (isPointInPolygon) {
        pointsInPolygon.push(point);
      }
    }
  }
  return pointsInPolygon;
}

function findLinesIntersectingPolygon(polygonFeatures, lineStringFeatures) {
  const intersectingLineStrings = [];

  if (isEmpty(polygonFeatures)) {
    return intersectingLineStrings;
  }

  for (let polygon of polygonFeatures) {
    polygon = getPolygon(polygon);
    for (const lineString of lineStringFeatures) {
      const lineIntersectsPolygon = booleanIntersects(polygon, lineString);
      if (lineIntersectsPolygon) {
        intersectingLineStrings.push(lineString);
      }
    }
  }
  return intersectingLineStrings;
}
