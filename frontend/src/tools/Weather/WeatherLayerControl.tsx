import type { LayerControlProps } from "../Tool";
import SimpleLayerControl from "@/components/SimpleLayerControl";
import ComplexLayerControl from "@/components/ComplexLayerControl";

export default function WeatherLayerControl({
  searchQuery,
}: Readonly<LayerControlProps>) {
  if (
    searchQuery &&
    !(
      "Weather".toLowerCase().includes(searchQuery.toLowerCase()) ||
      "Live weather".toLowerCase().includes(searchQuery.toLowerCase()) ||
      "Live".toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) {
    return null;
  }

  return (
    <ComplexLayerControl title="Weather">
      {(updateSelectedCount) => (
        <SimpleLayerControl
          layerName="weather"
          title="Live weather"
          searchQuery={searchQuery}
          updateSelectedCount={updateSelectedCount}
        />
      )}
    </ComplexLayerControl>
  );
}
