import React, { useCallback, useEffect, useState } from "react";

import { heatmap } from "../layers";
import { getMapStyles } from "../mapStyles";
import { ToolbarButton, ToolbarMenu, VerticalDivider } from "lib";
import DrawControls from "./DrawControl";

const MapToolbar = ({
  heatmapRadius,
  map,
  mapStyle,
  setMapStyle,
  showPointerCoords,
  onPointerCoordsClick,
  setCursor,
  layerItems,
}) => {
  const [isHeatVisible, setIsHeatVisible] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [showMapStyles, setShowMapStyles] = useState(false);
  const [showMapTools, setShowMapTools] = useState(false);
  const mapStyles = getMapStyles();

  const handleLayerVisibility = useCallback(
    (layerId, isVisible) => {
      map?.getMap().setLayoutProperty(layerId, "visibility", isVisible ? "visible" : "none");
    },
    [map]
  );

  const onStyleLoad = useCallback(() => {
    handleLayerVisibility(heatmap.id, isHeatVisible);
    map?.getMap().setPaintProperty(heatmap.id, "heatmap-radius", heatmapRadius);
  }, [map, handleLayerVisibility, isHeatVisible, heatmapRadius]);

  useEffect(() => {
    map?.on("style.load", heatmap.id, onStyleLoad);
    return () => {
      map?.off("style.load", heatmap.id, onStyleLoad);
    };
  }, [map, onStyleLoad]);

  const handleZoomOut = () => {
    if (!map) return;
    map.zoomOut({ duration: 1000 });
  };

  const handleZoomIn = () => {
    if (!map) return;
    map.zoomIn({ duration: 1000 });
  };

  const isLayerVisible = (layerId) => {
    if (map?.getLayer(layerId)) {
      const visibility = map?.getLayoutProperty(layerId, "visibility");
      return visibility === "visible";
    }
    return false;
  };

  const toggleHeatVisibility = () => {
    const { id } = heatmap;
    const isVisible = isLayerVisible(id);
    setIsHeatVisible(!isVisible);
    handleLayerVisibility(id, !isVisible);
  };

  const mapMenuItems = mapStyles.map(({ name, id }) => ({
    name: name,
    selected: name === mapStyle.name,
    type: "button",
    onItemClick: () => {
      setMapStyle({ id, name });
      handleLayerVisibility(heatmap.id, isHeatVisible);
    },
  }));

  const layersMenuItems = [
    {
      name: "Heatmap",
      selected: isHeatVisible,
      type: "toggleSwitch",
      onItemClick: () => toggleHeatVisibility(),
    },
    ...layerItems,
  ];

  const mapTools = [
    {
      name: "Coordinates",
      selected: showPointerCoords,
      type: "toggleSwitch",
      onItemClick: onPointerCoordsClick,
    },
  ];

  return (
    <ul className="toolbar toolbar__list bottom-0 left-0 font-body">
      <ToolbarButton icon="ri-subtract-line" label="Zoom out" onClick={handleZoomOut} />
      <ToolbarButton icon="ri-add-line" label="Zoom in" onClick={handleZoomIn} />
      <VerticalDivider />
      <ToolbarButton
        icon="ri-tools-line"
        label="Map tools"
        onClick={() => setShowMapTools(true)}
        showSecondaryMenu={showMapTools}
        secondaryMenu={<ToolbarMenu menuItems={mapTools} onClose={() => setShowMapTools(false)} />}
      />
      <ToolbarButton
        icon="ri-map-2-fill"
        label="Map style"
        onClick={() => setShowMapStyles(true)}
        showSecondaryMenu={showMapStyles}
        secondaryMenu={
          <ToolbarMenu menuItems={mapMenuItems} onClose={() => setShowMapStyles(false)} />
        }
      />
      <ToolbarButton
        icon="ri-stack-line"
        label="Layers"
        onClick={() => setShowLayers(true)}
        showSecondaryMenu={showLayers}
        secondaryMenu={
          <ToolbarMenu menuItems={layersMenuItems} onClose={() => setShowLayers(false)} />
        }
      />
      <VerticalDivider />
      <DrawControls compact map={map} setCursor={setCursor} />
    </ul>
  );
};

export default MapToolbar;
