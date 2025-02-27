import type { LayerControlProps } from "../Tool";
import SimpleLayerControl from "@/components/SimpleLayerControl";

export default function WeatherLayerControl({
  searchQuery,
}: Readonly<LayerControlProps>) {
  return (
    <SimpleLayerControl
      layerName="weather"
      title="Live weather"
      searchQuery={searchQuery}
    />
  );
}
