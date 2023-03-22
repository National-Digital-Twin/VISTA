const polygon = {
  id: "flood-area-ploygon",
  type: "fill",
  source: "flood-areas",
  layout: {},
  paint: {
    "fill-color": "#059ec0",
    "fill-opacity": 0.4,
  },
};
const polygonOutline = {
  id: "flood-area-outline",
  type: "line",
  source: "flood-areas",
  layout: {},
  paint: {
    "line-color": "#04345c",
    "line-width": 2,
  },
};
const labels = {
  id: "flood-area-labels",
  type: "symbol",
  source: "flood-areas",
  layout: {
    "text-field": ["get", "TA_NAME"],
    "text-variable-anchor": ["top", "bottom", "left", "right"],
    "text-radial-offset": 0.4,
    "text-justify": "auto",
    "text-font": ["Urbanist"],
    "text-size": 14,
    "icon-image": "circle",
    "icon-size": 0,
    "symbol-placement": "line",
  },
  paint: {
    "icon-opacity": 0,
    "text-color": "#DDDDDD",
    "icon-color": "#DDDDDD",
  },
};

const FLOOD_AREA_LAYERS = [polygon, polygonOutline, labels];
export default FLOOD_AREA_LAYERS;
