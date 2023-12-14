import { memoize } from "lodash";
import config from "config/app-config";

const createMapTilerStyle = (styleId) => `${styleId}?key=${config.map.maptilerToken}`;
const MAP_TILER_STYLES = [
  {
    id: createMapTilerStyle("https://api.maptiler.com/maps/streets-v2-dark/style.json"),
    name: "Streets",
  },
  { id: createMapTilerStyle("https://api.maptiler.com/maps/hybrid/style.json"), name: "Satellite" },
  {
    id: createMapTilerStyle("https://api.maptiler.com/maps/basic-v2-dark/style.json"),
    name: "Basic",
  },
  {
    id: createMapTilerStyle("https://api.maptiler.com/maps/bright-v2-dark/style.json"),
    name: "Bright",
  },
];

export const getMapStyles = memoize(() => {
  const styles = config?.map?.maptilerToken !== "offline_enabled" ? MAP_TILER_STYLES : [];
  if (config.map.offline.enabled) {
    const offlineStyles = config.map.offline.styles.map((style) => ({
      id: `${config.map.offline.base_url}${config.map.offline.styles_path.replace(
        "<STYLE>",
        style
      )}`,
      name: style.charAt(0).toUpperCase() + style.slice(1),
    }));
    styles.push(...offlineStyles);
  }
  return styles;
});
