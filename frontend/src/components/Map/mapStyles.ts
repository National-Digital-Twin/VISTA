import { useMemo } from "react";
import { useDarkMode } from "usehooks-ts";

export interface MapStyle {
  /** Map style ID by its URI (varies between light/dark) */
  id: string;
  /** User-visible name of the map style */
  name: string;
  /** Internal key for the map style (consistent across light/dark) */
  key: string;
}

function getMapTilerStyles(darkMode: boolean): MapStyle[] {
  const darkLight = darkMode ? "-dark" : "";
  return [
    {
      id: "https://api.os.uk/maps/vector/v1/vts/resources/styles?srs=3857",
      name: "Ordnance Survey",
      key: "os",
    },
    {
      id: `/transparent-proxy/maptiler/maps/streets-v2${darkLight}/style.json`,
      name: "Streets",
      key: "streets",
    },
    {
      id: "/transparent-proxy/maptiler/maps/hybrid/style.json",
      name: "Satellite",
      key: "satellite",
    },
    {
      id: `/transparent-proxy/maptiler/maps/basic-v2${darkLight}/style.json`,
      name: "Basic",
      key: "basic",
    },
    {
      id: `/transparent-proxy/maptiler/maps/bright-v2${darkLight}/style.json`,
      name: "Bright",
      key: "bright",
    },
  ];
}

export function useMapStyles() {
  const { isDarkMode } = useDarkMode();
  return useMemo(() => getMapTilerStyles(isDarkMode), [isDarkMode]);
}
