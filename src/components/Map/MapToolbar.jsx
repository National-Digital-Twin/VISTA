/* eslint jsx-a11y/anchor-has-content: 0 */
import React, { useCallback, useEffect, useState } from "react";

import { ToolbarButton, ToolbarMenu, VerticalDivider } from "lib";
import { heatmap } from "./layerStyles";
import { getMapStyles } from "./mapStyles";

const MapToolbar = ({
  heatmapRadius,
  map,
  mapStyle,
  showCoordinates,
  activateDrawCircleMode,
  activatePolygonMode,
  deleteAllPolygons,
  setMapStyle,
  togglePointerCoords
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
    map?.on("style.load", onStyleLoad);
    return () => {
      map?.off("style.load", onStyleLoad);
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
    selected: id === mapStyle,
    type: "button",
    onItemClick: () => {
      setMapStyle(id);
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
  ];

  const mapTools = [
    {
      name: "Coordinates",
      selected: showCoordinates,
      type: "toggleSwitch",
      onItemClick: () => togglePointerCoords()
    }
  ]

  return (
    <div className="absolute bottom-0 left-0 text-whiteSmoke font-body bg-black-200 flex items-center justify-center gap-x-2 px-2 py-1">
      <a
        className="mapboxgl-ctrl-logo"
        target="_blank"
        rel="noopener nofollow noreferrer"
        href="https://www.mapbox.com/"
        aria-label="Mapbox logo"
      />
      <VerticalDivider />
      <ToolbarButton icon="ri-subtract-line" label="Zoom out" onClick={handleZoomOut} />
      <ToolbarButton icon="ri-add-line" label="Zoom in" onClick={handleZoomIn} />
      <VerticalDivider />
      <ToolbarButton
        icon="ri-tools-line"
        label="Map tools"
        onClick={() => setShowMapTools(true)}
        showSecondaryMenu={showMapTools}
        secondaryMenu={
          <ToolbarMenu menuItems={mapTools} onClose={() => setShowMapTools(false)} />
        }
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
      <ToolbarButton
        icon="fg-polyline-pt"
        label="Polygon Selection (Beta) - Disabled"
        onClick={activatePolygonMode}
        disabled
      />
      <ToolbarButton
        icon="fg-circle-o"
        label="Radius Selection (Beta) - Disabled"
        onClick={activateDrawCircleMode}
        disabled
      />
      <ToolbarButton
        icon="ri-delete-bin-line"
        label="Delete Polygons - Disabled"
        onClick={deleteAllPolygons}
        disabled
      />
    </div>
  );
};

export default MapToolbar;
