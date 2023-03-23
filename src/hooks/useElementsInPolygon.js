import * as turf from "@turf/turf";
import { isEmpty } from "lodash";
import * as MapboxDrawGeodesic from "mapbox-gl-draw-geodesic";
import { findElement } from "utils";

const useElementsInPolygon = () => {
  const findElementsInPolygons = ({ target, polygons, assets, dependencies }) => {
    const pointAssets = target.getSource("point-assets")._data.features;
    const pointsInPolygon = findPointsInPolygon(polygons, pointAssets);

    // const pointAssetDependecies = target.getSource("point-asset-dependecies")._data.features;
    // const PADIntersectingPolygon = findLinesIntersectingPolygon(polygons, pointAssetDependecies);

    const linearAssets = target.getSource("linear-assets")._data.features;
    const LAIntersectingPolygon = findLinesIntersectingPolygon(polygons, linearAssets);

    const elements = [...pointsInPolygon, ...LAIntersectingPolygon].map((element) => {
      return findElement([...assets, ...dependencies], element.properties.uri);
    });

    return elements;
  };
  return { findElementsInPolygons };
};

export default useElementsInPolygon;

const getPolygon = (feature) => {
  if (MapboxDrawGeodesic.isCircle(feature)) {
    const center = MapboxDrawGeodesic.getCircleCenter(feature);
    const radius = parseFloat(Math.fround(feature.properties.circleRadius).toFixed(3));
    feature.properties = {
      ...feature.properties,
      center,
      radius,
    };

    const circle = turf.circle(center, radius, {
      steps: 50,
      units: "kilometers",
      properties: { center, radius },
    });
    return circle;
  }
  return feature;
};

const findPointsInPolygon = (polygonFeatures, points) => {
  const pointsInPolygon = [];

  if (isEmpty(polygonFeatures)) return pointsInPolygon;

  for (let polygon of polygonFeatures) {
    polygon = getPolygon(polygon);
    for (const point of points) {
      const isPointInPolygon = turf.booleanPointInPolygon(point, polygon);
      if (isPointInPolygon) pointsInPolygon.push(point);
    }
  }
  return pointsInPolygon;
};

export const findLinesIntersectingPolygon = (polygonFeatures, lineStringFeatures) => {
  const intersectingLineStrings = [];

  if (isEmpty(polygonFeatures)) return intersectingLineStrings;

  for (let polygon of polygonFeatures) {
    polygon = getPolygon(polygon);
    for (const lineString of lineStringFeatures) {
      const lineIntersectsPolygon = turf.booleanIntersects(polygon, lineString);
      if (lineIntersectsPolygon) intersectingLineStrings.push(lineString);
    }
  }
  return intersectingLineStrings;
};
