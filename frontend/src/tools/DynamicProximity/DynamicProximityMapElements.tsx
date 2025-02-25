// import { useEffect, useRef, useState } from "react";
import { Layer } from "react-map-gl/maplibre";
import { point } from "@turf/turf";
import useDynamicProximity from "./useDynamicProximity";

export default function DynamicProximityMapElements() {
  const { features } = useDynamicProximity();

  if (!features.length) {
    return null;
  }

  const buildingLayerId = "OS/TopographicArea_2/Building/1_4D";
  const pointLayerId = "OS/TopographicPoint/Structure_distinct_name";

  const buildingLayerPaint = {
    "fill-extrusion-color": [
      "case",
      [
        "any",
        ...features.map(({ properties }) => [
          "<=",
          ["distance", point(properties.center)],
          properties.radiusInKm * 1000,
        ]),
      ],
      "blue",
      "green",
    ],
    "fill-extrusion-height": ["get", "RelHMax"],
    "fill-extrusion-opacity": 0.6,
  };

  const pointLayerPaint = {
    "icon-color": "black",
  };

  return (
    <>
      <Layer
        id={buildingLayerId}
        source="esri"
        source-layer="TopographicArea_2"
        type="fill-extrusion"
        paint={buildingLayerPaint}
      />
      <Layer
        id={pointLayerId}
        source="esri"
        source-layer="TopographicPoint"
        type="symbol"
        paint={pointLayerPaint}
      />
    </>
  );
}
