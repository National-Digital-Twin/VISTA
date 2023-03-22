import { useState } from "react";

import { findElement } from "utils";
import {
  FLOOD_AREA_POLYGON_ID,
  FLOOD_AREA_POLYGON_OUTLINE_ID,
  LINEAR_ASSET_LAYER,
  pointAssetCxnLayer,
  POINT_ASSET_LAYER,
} from "components/Map/layers";
import useElementsInPolygon from "./useElementsInPolygon";

const useMapInteractions = ({
  assets,
  dependencies,
  selectedElements,
  onElementClick,
  onAreaSelect,
  moveTo,
}) => {
  const { findElementsInPolygons } = useElementsInPolygon();

  const [selectedFloodZones, setSelectedFloodZones] = useState([]);

  const interactiveLayers = [
    POINT_ASSET_LAYER.id,
    pointAssetCxnLayer.id,
    LINEAR_ASSET_LAYER.id,
    FLOOD_AREA_POLYGON_ID,
  ];

  const onFloodZoneClick = (target, clickedFloodZones) => {
    const floodZoneFeatures = target.queryRenderedFeatures({
      layers: [FLOOD_AREA_POLYGON_OUTLINE_ID],
    });

    updateSelectedFeatureState({
      target,
      renderedFeatures: floodZoneFeatures,
      clickedFeatures: clickedFloodZones,
    });

    const elementsToSelect = findElementsInPolygons({
      target,
      polygons: clickedFloodZones,
      assets,
      dependencies,
    });

    const uniqueElements = elementsToSelect.reduce((acc, current) => {
      const isAdded = acc.find((element) => element.uri === current.uri);
      if (isAdded) {
        return acc;
      } else {
        return acc.concat([current]);
      }
    }, []);

    onAreaSelect(uniqueElements);
    setSelectedFloodZones(clickedFloodZones);
  };

  const onOtherElementClick = ({ clickedFeature, isMultiSelect }) => {
    if (!clickedFeature) return;
    const { properties } = clickedFeature;
    const element = findElement([...assets, ...dependencies], properties.uri);

    onElementClick(isMultiSelect, element);
    moveTo({ isMultiSelect, cachedElements: selectedElements, selectedElement: element });
  };

  const handleOnClick = (event) => {
    const { originalEvent, target } = event;
    originalEvent.stopPropagation();

    const clickedFeatures = event?.features || [];

    const clickedFloodZones = clickedFeatures.filter((feature) =>
      isClickedLayer(feature, FLOOD_AREA_POLYGON_ID)
    );
    const otherClickedElements = clickedFeatures.filter(
      (feature) => !isClickedLayer(feature, FLOOD_AREA_POLYGON_ID)
    );

    onFloodZoneClick(target, clickedFloodZones);
    onOtherElementClick({
      clickedFeature: otherClickedElements[0],
      isMultiSelect: event.originalEvent.shiftKey,
    });
  };

  return { interactiveLayers, selectedFloodZones, handleOnClick };
};

export default useMapInteractions;

const isClickedLayer = (feature, layerId) => feature.layer.id === layerId;

const updateSelectedFeatureState = ({ target, renderedFeatures, clickedFeatures }) => {
  renderedFeatures.forEach((renderedFeature) => {
    const isSelected = clickedFeatures.some(
      (clickedFeature) => clickedFeature.id === renderedFeature.id
    );
    target.setFeatureState(
      {
        source: "flood-areas",
        id: renderedFeature.id,
      },
      {
        selected: isSelected,
      }
    );
  });
};
