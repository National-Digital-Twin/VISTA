export { default as FLOOD_AREA_LAYERS } from "./flood-areas";
export * from "./flood-areas";
export * from "./asset-layers";

export const pointAssetCxnLayer = {
  id: "point-asset-connection-layer",
  type: "line",
  source: "point-asset-connections",
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
  paint: {
    "line-width": 2,
    "line-color": ["get", "lineColor"],
    "line-opacity": ["get", "lineOpacity"],
  },
};

export const heatmap = {
  id: "assets-heat",
  type: "heatmap",
  source: "assets",
  layout: {
    visibility: "none",
  },
  paint: {
    "heatmap-color": [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(102,37,3,0)",
      0.2,
      "rgb(102,37,3)",
      0.4,
      "rgb(204,76,0)",
      0.6,
      "rgb(250,153,40)",
      0.8,
      "rgb(254,227,145)",
      1,
      "rgb(255,255,229)",
    ],
    "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 4, 0, 5, 1, 18, 0.7],
  },
};
