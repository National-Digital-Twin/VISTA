import { Source, Layer } from "react-map-gl/maplibre";
import { useQuery } from "@tanstack/react-query";
import { FillLayerSpecification } from "maplibre-gl";
import { layers } from "./environmentally-sensitive-areas-layers";

const layerPaint = {
  "fill-color": "rebeccapurple",
  "fill-opacity": 0.5,
} satisfies FillLayerSpecification["paint"];

interface EnvironmentallySensitiveAreasLayerProps {
  layerId: keyof typeof layers;
}

export function EnvironmentallySensitiveAreasLayer({
  layerId,
}: EnvironmentallySensitiveAreasLayerProps) {
  const { data } = useQuery({
    queryKey: ["environmentally-sensitive-areas-layer", layerId],
    queryFn: layers[layerId].layerFile,
  });

  if (!data) {
    return null;
  }

  return (
    <Source
      key={layerId}
      id={layerId}
      type="geojson"
      data={data.default}
      generateId
    >
      <Layer id={layerId} type="fill" source={layerId} paint={layerPaint} />
    </Source>
  );
}
