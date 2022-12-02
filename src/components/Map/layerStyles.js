export const pointAssetLayer = {
  id: "point-assets",
  type: "circle",
  source: "point-assets",
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

export const heatmap = {
  id: "assets-heat",
  type: "heatmap",
  source: "assets",
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
