import { useEffect, useState } from "react";

import { findElement } from "utils";
import {
  FLOOD_AREA_POLYGON_ID,
  FLOOD_AREA_POLYGON_OUTLINE_ID,
  LINEAR_ASSET_LAYER,
  pointAssetCxnLayer,
} from "components/Map/layers";
import useElementsInPolygons from "./useElementsInPolygons";
import { isEmpty } from "lodash";

const useMapInteractions = ({
  map,
  assets,
  dependencies,
  selectedElements,
  onElementClick,
  onAreaSelect,
  moveTo,
}) => {
  const { findElementsInPolygons } = useElementsInPolygons();

  const [selectedFloodZones, setSelectedFloodZones] = useState([]);

  const interactiveLayers = [pointAssetCxnLayer.id, LINEAR_ASSET_LAYER.id, FLOOD_AREA_POLYGON_ID];

  useEffect(() => {
    const polygonOutlineLayer = map?.getLayer(FLOOD_AREA_POLYGON_OUTLINE_ID);
    if (!polygonOutlineLayer) return;

    const floodZoneFeatures = map.getMap().queryRenderedFeatures({
      layers: [FLOOD_AREA_POLYGON_OUTLINE_ID],
    });

    updateSelectedFeatureState({
      map: map.getMap(),
      renderedFeatures: floodZoneFeatures,
      clickedFeatures: selectedFloodZones,
    });
  }, [map, selectedFloodZones]);

  const onFloodZoneClick = ({ target, clickedFloodZones, isMultiSelect }) => {
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

    if (!isEmpty(clickedFloodZones)) onAreaSelect(uniqueElements);

    if (isMultiSelect) {
      setSelectedFloodZones((prevSelection) =>
        getAllSelectedPolygons([...prevSelection, ...clickedFloodZones])
      );
      return;
    }
    setSelectedFloodZones(clickedFloodZones);
  };

  const onOtherElementClick = ({ clickedFeature, isMultiSelect }) => {
    if (!clickedFeature) return;
    const { properties } = clickedFeature;
    const element = findElement([...assets, ...dependencies], properties.uri);

    onElementClick(isMultiSelect, [element]);
    moveTo({ cachedElements: selectedElements, selectedElements: [element] });
  };

  const handleOnClick = (event) => {
    const { originalEvent, target } = event;
    originalEvent.stopPropagation();

    const isMultiSelect = originalEvent.shiftKey;
    const clickedFeatures = event?.features || [];

    const clickedFloodZones = clickedFeatures.filter((feature) =>
      isClickedLayer(feature, FLOOD_AREA_POLYGON_ID)
    );
    const otherClickedElements = clickedFeatures.filter(
      (feature) =>
        isClickedLayer(feature, pointAssetCxnLayer.id) ||
        isClickedLayer(feature, LINEAR_ASSET_LAYER.id)
    );

    if (isEmpty(clickedFeatures)) onElementClick(false, []);
    onFloodZoneClick({ target, clickedFloodZones, isMultiSelect });
    onOtherElementClick({
      clickedFeature: otherClickedElements[0],
      isMultiSelect,
    });
  };

  return { interactiveLayers, selectedFloodZones, handleOnClick };
};

export default useMapInteractions;

const isClickedLayer = (feature, layerId) => feature.layer.id === layerId;

const updateSelectedFeatureState = ({ map, renderedFeatures, clickedFeatures }) => {
  renderedFeatures.forEach((renderedFeature) => {
    const isSelected = clickedFeatures.some(
      (clickedFeature) => clickedFeature.id === renderedFeature.id
    );
    map.setFeatureState(
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

const getAllSelectedPolygons = (selected) => {
  const uniquePolygons = selected.reduce((acc, current) => {
    const isAdded = acc.find((feature) => feature.properties.id === current.properties.id);
    if (isAdded) {
      return acc;
    } else {
      return acc.concat([current]);
    }
  }, []);
  return uniquePolygons;
};
