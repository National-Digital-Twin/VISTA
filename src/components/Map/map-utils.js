import * as turf from "@turf/turf";
import { isEmpty } from "lodash";

const filterEmptyElements = (element) => !isEmpty(element);

export const generatePointAssetFeatures = (assets, dependencies, selectedElements) => {
  const pointAssets = assets
    .filter((asset) => asset.lat && asset.lng)
    .map((asset) => {
      return asset.createPointAsset();
    })
    .filter(filterEmptyElements);

  const pointAssetDependencies = dependencies
    .map((dependency) => {
      return dependency.createLineFeature(assets, selectedElements);
    })
    .filter(filterEmptyElements);
  return [...pointAssetDependencies, ...pointAssets];
};

export const generateLinearAssetFeatures = (assets, selectedElements) => {
  const linearAssets = assets
    .filter((asset) => !isEmpty(asset.geometry))
    .map((asset) => asset.createLinearAsset(selectedElements))
    .filter(filterEmptyElements);

  return linearAssets;
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
    padding: { top: 15, bottom: 25, left: 15, right: 55 },
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
