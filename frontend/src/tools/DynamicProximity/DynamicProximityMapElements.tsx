import map, { Layer } from "react-map-gl/maplibre";
import { point } from "@turf/turf";
import useDynamicProximity from "./useDynamicProximity";
import { useEffect, useRef, useState } from "react";

export default function DynamicProximityMapElements() {
  const { features } = useDynamicProximity();
  const mapRef = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  if (!features.length) return null;

  const buildingLayerId = "OS/TopographicArea_2/Building/1_4D";
  const pointLayerId = "OS/TopographicPoint/Structure_distinct_name";

      const mapInstance = mapRef.current;
    const handleLoadChange = () => {
      const mapInstance = mapRef.current.getMap();
      if (mapInstance.isStyleLoaded()) {
        setIsMapLoaded(true);
      }
    if (mapRef.current && mapRef.current.isStyleLoaded()) {

      mapRef.current.on("styledata", handleLoadChange);
      mapRef.current.on("styledata", handleLoadChange);
      mapInstance.on("styledata", handleLoadChange);
      mapInstance.on("styledata", handleLoadChange);
      mapRef.current.off("styledata", handleLoadChange);
      mapRef.current.off("styledata", handleLoadChange);
      mapInstance.off("styledata", handleLoadChange);
      mapInstance.off("styledata", handleLoadChange);
      setIsMapLoaded(false);
    }
  };

  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      mapRef.current.on("styledata", handleLoadChange);
      mapRef.current.on("styledata", handleLoadChange);
      mapInstance.on("styledata", handleLoadChange);
      mapRef.current.on("styledata", handleLoadChange);
      mapRef.current.off("styledata", handleLoadChange);
      mapRef.current.off("styledata", handleLoadChange);
      mapInstance.off("styledata", handleLoadChange);
      mapRef.current.off("styledata", handleLoadChange);
      setIsMapLoaded(false);
    }
  }, [map]);
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
        filter={["==", "_symbol", 12]}
        paint={pointLayerPaint}
      />
    </>
  );
}
