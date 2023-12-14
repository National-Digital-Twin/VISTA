export const LINEAR_ASSET_LAYER = {
  id: "linear-assets-layer",
  type: "line",
  source: "linear-assets",
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
  paint: {
    "line-color": ["get", "lineColor"],
    "line-width": 3,
  },
};

export const POINT_ASSET_LAYER = {
  id: "point-assets-layer",
  type: "circle",
  source: "point-assets",
  paint: {
    "circle-radius": ["get", "circleSize"],
    "circle-color": ["get", "backgroundColor"],
    "circle-stroke-color": ["get", "circleStrokeColor"],
    "circle-stroke-width": ["get", "circleStrokeWidth"],
  },
};
