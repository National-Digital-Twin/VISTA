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
  id: "connection",
  type: "line",
  source: "selected-connections",
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
  paint: {
    "line-width": 2,
    "line-color": ["get", "color"],
  },
};

export const segmentStyle = {
  id: "segments",
  type: "line",
  source: "selected-segments",
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
  paint: {
    "line-color": ["get", "color"],
    "line-width": 3,
  },
};

export const highlightedAssets = {
  id: "highlighted-asset-points",
  type: "circle",
  paint: {
    "circle-radius": ["get", "size"],
    "circle-color": ["get", "color"],
    "circle-stroke-color": [
      "match",
      ["get", "selected"],
      "source",
      "#E9E9E9",
      "rgba(255,255,255,0)",
    ],
    "circle-stroke-width": 2,
  },
};
