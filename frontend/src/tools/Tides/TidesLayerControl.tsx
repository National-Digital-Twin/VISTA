import { faWaveSquare } from "@fortawesome/free-solid-svg-icons";
import SimpleLayerControl from "@/components/SimpleLayerControl";
import type { LayerControlProps } from "@/tools/Tool";

export default function TidesLayerControl({
  searchQuery,
}: Readonly<LayerControlProps>) {
  return (
    <SimpleLayerControl
      layerName="tides"
      icon={faWaveSquare}
      title="Tidal monitoring"
      searchQuery={searchQuery}
    />
  );
}
