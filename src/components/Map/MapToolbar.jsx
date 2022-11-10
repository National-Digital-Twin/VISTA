/* eslint jsx-a11y/anchor-has-content: 0 */
import classNames from "classnames";
import React, { useRef, useState } from "react";
import { useMap } from "react-map-gl";
import { useOutsideAlerter } from "../../hooks";
import { TelicentSwitch, ToolbarButton, VerticalDivider } from "../../lib";
import { getMapStyles } from "./mapStyles";
import useDraw from "./useDraw";

const MapToolbar = ({ mapStyle: selectedMapStyle, setMapStyle }) => {
  const { telicentMap: map } = useMap();

  const [isHeatVisible, setIsHeatVisible] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const { activatePolygonMode, deleteAllPolygons } = useDraw();
  const [showMapStyles, setShowMapStyles] = useState(false);

  const mapStyles = getMapStyles();

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
      return setIsHeatVisible(visibility === "visible");
    }
    return setIsHeatVisible(false);
  };

  const handleLayerVisibility = (layerId) => {
    const isVisible = isLayerVisible(layerId);
    map.getMap().setLayoutProperty(layerId, "visibility", isVisible ? "none" : "visible");
  };

  const mapMenuItems = mapStyles.map(({ name, id }) => ({
    name: name,
    selected: id === selectedMapStyle,
    type: "button",
    onItemClick: () => setMapStyle(id),
  }));

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
        icon="ri-map-2-fill"
        label="Map style"
        onClick={() => setShowMapStyles(true)}
        showSecodaryMenu={showMapStyles}
        secondaryMenu={
          <SecondaryMenu menuItems={mapMenuItems} onClose={() => setShowMapStyles(false)} />
        }
      />
      <VerticalDivider />
      <ToolbarButton
        icon="ri-stack-line"
        label="Layers"
        onClick={() => setShowLayers(true)}
        showSecodaryMenu={showLayers}
        secondaryMenu={
          <SecondaryMenu
            menuItems={[
              {
                name: "Heatmap",
                selected: isHeatVisible,
                type: "toggleSwitch",
                onItemClick: () => handleLayerVisibility("assets-heat"),
              },
            ]}
            onClose={() => setShowLayers(false)}
          />
        }
      />
      <VerticalDivider />
      <ToolbarButton 
        icon="fg-polyline-pt" 
        label="Draw Polygon (Beta)" 
        onClick={() => { activatePolygonMode() }} />
      <ToolbarButton 
        icon="ri-delete-bin-line" 
        label="Delete Polygons" 
        onClick={() => { deleteAllPolygons() }}/>
    </div>
  );
};

export default MapToolbar;

const SecondaryMenu = ({ menuItems, onClose }) => {
  const containerRef = useRef();
  useOutsideAlerter({ ref: containerRef, fn: onClose });

  const generateMenuItems = ({ name, selected, type, onItemClick }) => {
    const typeProps = { name, selected, onItemClick };
    const menuItemTypes = {
      button: <SecondaryMenuBtn {...typeProps} />,
      toggleSwitch: <SecondaryMenuToggle {...typeProps} />,
    };

    return (
      <li key={name} className="whitespace-nowrap">
        {menuItemTypes[type]}
      </li>
    );
  };
/*   const generateMenuItems = ({ id, name }) => (
    <li key={name} className="whitespace-nowrap">
      <button
        className={classNames("hover:bg-black-400 px-2 rounded-md w-full h-full text-base", {
          "bg-black-500": id === mapStyle,
        })}
        onClick={() => setMapStyle(id)}
      >
        {name}
      </button>
    </li>
  ); */

  return (
    <ul
      ref={containerRef}
      className="absolute -top-12 bg-black-200 px-2 py-1 rounded-md flex gap-x-2 overflow-x-auto overscroll-x-contain scroll-smooth"
      style={{ maxWidth: "25rem" }}
    >
      {menuItems.map(generateMenuItems)}
    </ul>
  );
};

const SecondaryMenuBtn = ({ name, selected, onItemClick }) => (
  <button
    className={classNames("hover:bg-black-400 px-2 rounded-md w-full h-full", {
      "bg-black-500": selected,
    })}
    onClick={onItemClick}
  >
    {name}
  </button>
);

const SecondaryMenuToggle = ({ name, selected, onItemClick }) => (
  <TelicentSwitch label={name} checked={selected} onChange={onItemClick} />
);
