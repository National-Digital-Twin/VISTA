import { useCallback } from "react";
import { useMap } from "react-map-gl/maplibre";

import ToolbarButton from "@/components/Map/SideButtons/ToolbarButton";

export const TOOL_NAME = "Map compass control";

export function SideButtons() {
  const { paralogMap: map } = useMap();

  const handleCompassClick = useCallback(() => {
    if (!map) {
      return;
    }
    map.easeTo({ bearing: 0 });
  }, [map]);

  return (
    <>
      <ToolbarButton
        title="Compass"
        onClick={handleCompassClick}
        svgSrc="/icons/Compass.svg"
      />
    </>
  );
}

export const SIDE_BUTTON_ORDER = -1;
