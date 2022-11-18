/* eslint jsx-a11y/anchor-has-content: 0 */
import classNames from "classnames";
import React, { useRef, useState } from "react";
import { useMap } from "react-map-gl";
import { useLocalStorage, useOutsideAlerter } from "hooks";
import { ToolbarButton, VerticalDivider } from "lib";
import { getMapStyles } from "./mapStyles";

const MapToolbar = ({
  activateDrawCircleMode,
  activatePolygonMode,
  deleteAllPolygons,
}) => {
  const { telicentMap: map } = useMap();
  const [mapStyle, setMapStyle] = useLocalStorage("mapStyle", "mapbox://styles/mapbox/dark-v10");
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
        onClick={() => setShowMapStyles((show) => !show)}
        showSecodaryMenu={showMapStyles}
        secondaryMenu={
          <MapStyles
            items={mapStyles}
            mapStyle={mapStyle}
            onClose={() => setShowMapStyles(false)}
            setMapStyle={setMapStyle}
          />
        }
      />
      <VerticalDivider />
      <ToolbarButton
        icon="fg-polyline-pt"
        label="Polygon Selection (Beta)"
        onClick={() => {
          activatePolygonMode();
        }}
      />
      <ToolbarButton
        icon="fg-circle-o"
        label="Radius Selection (Beta)"
        onClick={() => activateDrawCircleMode()}
      />
      <ToolbarButton
        icon="ri-delete-bin-line"
        label="Delete Polygons"
        onClick={() => {
          deleteAllPolygons();
        }}
      />
    </div>
  );
};

export default MapToolbar;

const MapStyles = ({ items, mapStyle, onClose, setMapStyle }) => {
  const containerRef = useRef();
  useOutsideAlerter({ ref: containerRef, fn: onClose });

  const generateMenuItems = ({ id, name }) => (
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
  );

  return (
    <ul
      ref={containerRef}
      className="absolute -top-12 bg-black-200 px-2 py-1 rounded-md flex gap-x-2 overflow-x-auto overscroll-x-contain scroll-smooth"
      style={{ maxWidth: "25rem" }}
    >
      {items.map(generateMenuItems)}
    </ul>
  );
};
