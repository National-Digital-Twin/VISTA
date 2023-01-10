import { isEmpty } from "lodash";
import * as turf from "@turf/turf";

export const fitMultiToBounds = (map, selectedElements, assets) => {
  if (isEmpty(selectedElements) || isEmpty(assets)) return;

  const lngLats = selectedElements
    .filter((element) => element?.isPointAsset)
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
  if (selectedElement?.isPointAsset) {
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
