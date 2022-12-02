import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";

import { ToolbarButton } from "../../lib";

const GridToolbar = ({ zoom, setZoom }) => {
  const ZOOM_OFFSET = 10;

  const enableZoomOut = zoom > 20;
  const enableZoomIn = zoom < 130;

  const updateZoomLevel = (zoomOffset) => {
    setZoom(zoom + zoomOffset);
  };

  const handleZoomOut = () => {
    if (enableZoomOut) updateZoomLevel(-ZOOM_OFFSET);
  };

  const handleZoomIn = () => {
    if (enableZoomIn) updateZoomLevel(ZOOM_OFFSET);
  };

  return (
    <div className="absolute bottom-0 left-0 bg-black-200 text-whiteSmoke font-body flex gap-x-2 px-2 py-1 w-fit">
      <ToolbarButton
        icon="ri-zoom-out-line"
        label="Zoom out"
        onClick={handleZoomOut}
        buttonClassName={classNames({ "cursor-not-allowed": !enableZoomOut })}
      />
      <ToolbarButton
        icon="ri-zoom-in-line"
        label="Zoom in"
        onClick={handleZoomIn}
        buttonClassName={classNames({ "cursor-not-allowed": !enableZoomIn })}
      />
    </div>
  );
};

export default GridToolbar;

GridToolbar.propTypes = {
  zoom: PropTypes.number.isRequired,
  setZoom: PropTypes.func.isRequired,
};
