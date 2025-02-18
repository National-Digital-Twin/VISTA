import type { Feature } from "geojson"; // Use Feature from geojson instead of MapboxGeoJSONFeature
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
  const [selectedFloodZones, setSelectedFloodZones] = useState<Feature[]>([]);

  const interactiveLayers = [
    pointAssetCxnLayer.id,
    LINEAR_ASSET_LAYER.id,
    FLOOD_AREA_POLYGON_ID,
  ];

  useEffect(() => {
    if (!map?.style || !map.getLayer(FLOOD_AREA_POLYGON_OUTLINE_ID)) {
      return;
    }

    const floodZoneFeatures = map.getMap().queryRenderedFeatures({
      layers: [FLOOD_AREA_POLYGON_OUTLINE_ID],
    }) as Feature[];

    updateSelectedFeatureState({
      map: map.getMap(),
      renderedFeatures: floodZoneFeatures,
      clickedFeatures: selectedFloodZones,
    });
  }, [map, selectedFloodZones]);

  const onFloodZoneClick = ({
    clickedFloodZones,
    isMultiSelect,
  }: {
    clickedFloodZones: Feature[];
    isMultiSelect: boolean;
  }) => {
    if (!isEmpty(clickedFloodZones) && clickedFloodZones.length > 1) {
      console.warn(
        "An unexpected case of >1 clicked zone; performance won't be optimal if many are clicked",
      );
    }

    setSelectedFloodZones((prevSelection) =>
      isMultiSelect
        ? getAllSelectedPolygons([...prevSelection, ...clickedFloodZones])
        : clickedFloodZones,
    );
  };

  const onOtherElementClick = ({
    clickedFeature,
    isMultiSelect,
  }: {
    clickedFeature?: Feature;
    isMultiSelect: boolean;
  }) => {
    if (!clickedFeature) return;

    const { properties } = clickedFeature;
    const element = findElement([...assets, ...dependencies], properties?.uri);

    if (element) {
      onElementClick(isMultiSelect, [element]);
    }
  };

  const handleOnClick = (event: any) => {
    const { originalEvent, features = [] } = event;
    originalEvent.stopPropagation();

    const isMultiSelect = originalEvent.shiftKey;
    const clickedFeatures: Feature[] = features;

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

function isClickedLayer(feature: Feature, layerId: string) {
  return feature?.properties?.layer?.id === layerId;
}

function updateSelectedFeatureState({
  map,
  renderedFeatures,
  clickedFeatures,
}: {
  map: any;
  renderedFeatures: Feature[];
  clickedFeatures: Feature[];
}) {
  renderedFeatures.forEach((renderedFeature) => {
    const isSelected = clickedFeatures.some(
      (clickedFeature) => clickedFeature?.id === renderedFeature?.id,
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

const getAllSelectedPolygons = (selected: Feature[]) => {
  return selected.reduce<Feature[]>((acc, current) => {
    if (
      !acc.some((feature) => feature.properties?.id === current.properties?.id)
    ) {
      acc.push(current);
    }
    return acc;
  }, []);
};
