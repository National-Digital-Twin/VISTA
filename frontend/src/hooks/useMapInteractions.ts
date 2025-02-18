// import type { MapboxGeoJSONFeature } from "react-map-gl";
import MapboxGeoJSONFeature from "react-map-gl";
import { useEffect, useState } from "react";

import { findElement } from "@/utils";
import {
  FLOOD_AREA_POLYGON_ID,
  FLOOD_AREA_POLYGON_OUTLINE_ID,
  LINEAR_ASSET_LAYER,
  pointAssetCxnLayer,
} from "@/components/Map/layers";
import { isEmpty } from "@/utils/isEmpty";
import type { Asset, Dependency, Element } from "@/models";

export default function useMapInteractions({
  map,
  assets,
  dependencies,
  onElementClick,
}: {
  map: any;
  assets: Asset[];
  dependencies: Dependency[];
  onElementClick: (isMultiSelect: boolean, selectedElements: Element[]) => void;
}) {
  const [selectedFloodZones, setSelectedFloodZones] = useState([]);

  const interactiveLayers = [
    pointAssetCxnLayer.id,
    LINEAR_ASSET_LAYER.id,
    FLOOD_AREA_POLYGON_ID,
  ];

  useEffect(() => {
    const polygonOutlineLayer =
      map?.style && map.getLayer(FLOOD_AREA_POLYGON_OUTLINE_ID);
    if (!polygonOutlineLayer) {
      return;
    }

    const floodZoneFeatures = map.getMap().queryRenderedFeatures({
      layers: [FLOOD_AREA_POLYGON_OUTLINE_ID],
    });

    updateSelectedFeatureState({
      map: map.getMap(),
      renderedFeatures: floodZoneFeatures,
      clickedFeatures: selectedFloodZones,
    });
  }, [map, selectedFloodZones]);

  const onFloodZoneClick = ({ clickedFloodZones, isMultiSelect }) => {
    if (!isEmpty(clickedFloodZones)) {
      if (clickedFloodZones.length > 1) {
        console.warn(
          "An unexpected case of >1 clicked zone; performance won't be optimal if many are clicked",
        );
      }
    }

    if (isMultiSelect) {
      setSelectedFloodZones((prevSelection) =>
        getAllSelectedPolygons([...prevSelection, ...clickedFloodZones]),
      );
      return;
    }
    setSelectedFloodZones(clickedFloodZones);
  };

  const onOtherElementClick = ({ clickedFeature, isMultiSelect }) => {
    if (!clickedFeature) {
      return;
    }
    const { properties } = clickedFeature;
    const element = findElement([...assets, ...dependencies], properties.uri);

    onElementClick(isMultiSelect, [element]);
  };

  const handleOnClick = (event) => {
    const { originalEvent } = event;
    originalEvent.stopPropagation();

    const isMultiSelect = originalEvent.shiftKey;
    const clickedFeatures: MapboxGeoJSONFeature[] = event?.features || [];

    const clickedFloodZones = clickedFeatures.filter((feature) =>
      isClickedLayer(feature, FLOOD_AREA_POLYGON_ID),
    );
    const otherClickedElements = clickedFeatures.filter(
      (feature) =>
        isClickedLayer(feature, pointAssetCxnLayer.id) ||
        isClickedLayer(feature, LINEAR_ASSET_LAYER.id),
    );

    if (isEmpty(clickedFeatures)) {
      onElementClick(false, []);
    }
    onFloodZoneClick({ clickedFloodZones, isMultiSelect });
    onOtherElementClick({
      clickedFeature: otherClickedElements[0],
      isMultiSelect,
    });
  };

  return { interactiveLayers, selectedFloodZones, handleOnClick };
}

function isClickedLayer(feature: MapboxGeoJSONFeature, layerId: string) {
  return feature.layer.id === layerId;
}

function updateSelectedFeatureState({
  map,
  renderedFeatures,
  clickedFeatures,
}: {
  map: any;
  renderedFeatures: MapboxGeoJSONFeature[];
  clickedFeatures: MapboxGeoJSONFeature[];
}) {
  renderedFeatures.forEach((renderedFeature) => {
    const isSelected = clickedFeatures.some(
      (clickedFeature) => clickedFeature.id === renderedFeature.id,
    );
    map.setFeatureState(
      {
        source: "flood-areas",
        id: renderedFeature.id,
      },
      {
        selected: isSelected,
      },
    );
  });
}

const getAllSelectedPolygons = (selected) => {
  const uniquePolygons = selected.reduce((acc, current) => {
    const isAdded = acc.find(
      (feature) => feature.properties.id === current.properties.id,
    );
    if (isAdded) {
      return acc;
    } else {
      return acc.concat([current]);
    }
  }, []);
  return uniquePolygons;
};
