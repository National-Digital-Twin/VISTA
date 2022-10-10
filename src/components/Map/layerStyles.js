export const allAssetsLayerStyle = {
  id: "all-asset-points",
  type: "circle",
  source: "all-assets",
  paint: {
    "circle-radius": 4,
    "circle-opacity": 0.8,
    "circle-color": "#333333",
    "circle-stroke-color": "#C4C4C4",
    "circle-stroke-width": 1,
  },
};

export const lineStyle = {
  id: "line",
  type: "line",
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
  paint: {
    "line-width": 1,
    "line-color": ["get", "color"],
  },
};

export const highlightedAssets = {
  id: "highlighted-asset-points",
  type: "circle",
  paint: {
    "circle-radius": ["get", "size"],
    "circle-color": ["get", "color"],
    "circle-stroke-color": ["match", ["get", "selected"], "true", "#E9E9E9", "rgba(255,255,255,0)"],
    "circle-stroke-width": 2,
  },
};
