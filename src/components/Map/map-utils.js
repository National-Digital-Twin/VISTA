import * as turf from "@turf/turf";
import { isEmpty } from "lodash";
import * as MapboxDrawGeodesic from "mapbox-gl-draw-geodesic";

export const generateFeatures = (assets, dependencies, selectedElements) => {
  const filterEmptyElements = (element) => !isEmpty(element);

  const pointAssets = assets
    .filter((asset) => asset.lat && asset.lng)
    .map((asset) => {
      return asset.createPointAsset(selectedElements);
    })
    .filter(filterEmptyElements);

  const pointAssetDependencies = dependencies
    .map((dependency) => {
      return dependency.createLineFeature(assets, selectedElements);
    })
    .filter(filterEmptyElements);

  const linearAssets = assets
    .filter((asset) => !isEmpty(asset.geometry))
    .map((asset) => asset.createLinearAsset(selectedElements))
    .filter(filterEmptyElements);

  return { pointAssets, pointAssetDependencies, linearAssets };
};

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

export const findPointsInPolygon = (polygonFeatures, points) => {
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

export const fitMultiToBounds = (map, selectedElements, assets) => {
  if (isEmpty(selectedElements) || isEmpty(assets)) return;

  const lngLats = selectedElements
    .filter((element) => element?.isPointAsset && element?.hasLatLng)
    .map((element) => [element.lng, element.lat]);
  const pointAssetMPFeature = turf.multiPoint(lngLats);

  const linearAssetGeometry = selectedElements
    .filter((element) => element?.isLinearAsset)
    .map((element) => element.createSegmentCoords());
  const linearAssetMLSFeature = turf.multiLineString(linearAssetGeometry);

  const dependencyGeometry = selectedElements
    .filter((element) => element?.isDependency)
    .map((element) => element.generateCoordinates(assets));
  const dependencyMLSFeature = turf.multiLineString(dependencyGeometry);

  if (
    isEmpty(pointAssetMPFeature.geometry.coordinates) &&
    isEmpty(linearAssetMLSFeature.geometry.coordinates) &&
    isEmpty(dependencyMLSFeature.geometry.coordinates)
  )
    return;

  const collection = turf.featureCollection([
    pointAssetMPFeature,
    linearAssetMLSFeature,
    dependencyMLSFeature,
  ]);
  const bbox = turf.bbox(collection);

  map.fitBounds(bbox, {
    padding: { top: 10, bottom: 25, left: 15, right: 5 },
  });
};

const fitLineStringToBounds = (map, geometry) => {
  if (isEmpty(geometry)) return;

  const lineString = turf.lineString(geometry);
  const bbox = turf.bbox(lineString);

  map.fitBounds(bbox, {
    padding: { top: 10, bottom: 25, left: 15, right: 5 },
  });
};

export const fitToBounds = (map, selectedElement, assets) => {
  if (selectedElement?.isPointAsset && selectedElement?.hasLatLng) {
    map.flyTo({ center: [selectedElement.lng, selectedElement.lat], zoom: 12 });
    return;
  }

  if (selectedElement?.isLinearAsset) {
    const geometry = selectedElement.createSegmentCoords();
    fitLineStringToBounds(map, geometry);
    return;
  }

  if (selectedElement?.isDependency && !isEmpty(assets)) {
    const geometry = selectedElement.generateCoordinates(assets);
    fitLineStringToBounds(map, geometry);
    return;
  }
};

export const generateFloodAreaNodes = (floodWatchAreas) => {
  const nodes = (floodWatchAreas || []).map((floodWatchArea) => {
    const floodWatchAreaUri = floodWatchArea?.uri;
    const floodWatchAreaPolygonUri = floodWatchArea?.polygon_uri;
    const floodWatchAreaName = floodWatchArea?.name || floodWatchArea?.uri;

    if (!floodWatchAreaPolygonUri)
      throw new Error(`Flood watch area polygon for ${floodWatchAreaUri} is not defined`);

    const children = (floodWatchArea?.flood_areas || []).map((floodArea) => {
      const floodAreaPolygonUri = floodArea?.polygon_uri || undefined;
      const floodAreaName = floodArea?.name || floodArea?.uri;

      if (!floodAreaPolygonUri)
        throw new Error(`Flood area polygon for ${floodWatchAreaUri} is not defined`);
      return {
        value: floodAreaPolygonUri,
        label: floodAreaName,
      };
    });

    return {
      value: floodWatchAreaPolygonUri,
      label: floodWatchAreaName,
      children,
    };
  });
  return nodes;
};
