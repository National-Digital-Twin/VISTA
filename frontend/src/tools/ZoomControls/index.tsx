import { useCallback } from "react";
import { faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";
import { useMap } from "react-map-gl";

import ToolbarButton from "@/components/Map/SideButtons/ToolbarButton";

export const TOOL_NAME = "Map zoom controls";

export function SideButtons() {
  const { paralogMap: map } = useMap();

  const handleZoomOut = useCallback(() => {
    if (!map) {
      return;
    }
    map.zoomOut({ duration: 1000 });
  }, [map]);

  const handleZoomIn = useCallback(() => {
    if (!map) {
      return;
    }
    map.zoomIn({ duration: 1000 });
  }, [map]);

  return (
    <>
      <ToolbarButton title="Zoom in" onClick={handleZoomIn} icon={faPlus} />
      <ToolbarButton title="Zoom out" onClick={handleZoomOut} icon={faMinus} />
    </>
  );
}

export const SIDE_BUTTON_ORDER = -1;
