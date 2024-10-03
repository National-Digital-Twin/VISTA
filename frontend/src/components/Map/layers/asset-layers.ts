import type { LayerProps } from "react-map-gl/maplibre";

export const LINEAR_ASSET_LAYER: LayerProps = {
  id: "linear-assets-layer",
  type: "line",
  source: "linear-assets",
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
  paint: {
    "line-color": ["get", "lineColor"],
    "line-width": ["get", "lineWidth"],
  },
};

export const POINT_ASSET_LAYER: LayerProps = {
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
