import SimpleLayerControl from "@/components/SimpleLayerControl";
import type { LayerControlProps } from "@/tools/Tool";

export default function TidesLayerControl({
  searchQuery,
}: Readonly<LayerControlProps>) {
  return (
    <SimpleLayerControl
      layerName="tides"
      title="Tidal monitoring"
      searchQuery={searchQuery}
    />
  );
}
