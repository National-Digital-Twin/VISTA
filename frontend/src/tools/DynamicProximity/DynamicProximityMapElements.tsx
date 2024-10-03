import { Layer } from "react-map-gl";
import { point } from "@turf/turf";

import useDynamicProximity from "./useDynamicProximity";

export default function DynamicProximityMapElements() {
  const { features } = useDynamicProximity();

  if (features.length === 0) {
    return null;
  }

  return (
    <>
      <Layer
        source-layer="TopographicArea_2"
        id="OS/TopographicArea_2/Building/1_4D"
        type="fill-extrusion"
        source="esri"
        paint={{
          "fill-extrusion-color": [
            "case",
            [
              "any",
              ...features.map((feature) => [
                "<=",
                ["distance", point(feature.properties.center)],
                feature.properties.radiusInKm * 1000,
              ]),
            ],
            "blue",
            "green",
          ],
          "fill-extrusion-height": ["get", "RelHMax"],
          "fill-extrusion-opacity": 0.6,
        }}
      />

      <Layer
        id="OS/TopographicPoint/Structure_distinct_name"
        source="esri"
        type="symbol"
        source-layer="TopographicPoint"
        filter={["==", "_symbol", 12]}
        paint={{
          "icon-color": "black",
        }}
      />
    </>
  );
}
