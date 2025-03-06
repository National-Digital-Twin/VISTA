import type { LayerControlProps } from "../Tool";
import SimpleLayerControl from "@/components/SimpleLayerControl";
import ComplexLayerControl from "@/components/ComplexLayerControl";

export default function WeatherLayerControl({
  searchQuery,
}: Readonly<LayerControlProps>) {
  return (
    <ComplexLayerControl title="Weather">
      <SimpleLayerControl
        layerName="weather"
        title="Live weather"
        searchQuery={searchQuery}
      />
    </ComplexLayerControl>
  );
}
