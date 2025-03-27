import ComplexLayerControl from "@/components/ComplexLayerControl";
import SimpleLayerControl from "@/components/SimpleLayerControl";
import type { LayerControlProps } from "@/tools/Tool";

export default function TidesLayerControl({
  searchQuery,
}: Readonly<LayerControlProps>) {
  if (
    searchQuery &&
    !(
      "Tides".toLowerCase().includes(searchQuery.toLowerCase()) ||
      "Tidal".toLowerCase().includes(searchQuery.toLowerCase()) ||
      "monitoring".toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) {
    return null;
  }

  return (
    <ComplexLayerControl title="Tides">
      <SimpleLayerControl
        layerName="tides"
        title="Tidal monitoring"
        searchQuery={searchQuery}
      />
    </ComplexLayerControl>
  );
}
