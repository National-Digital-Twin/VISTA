import { EnvironmentallySensitiveAreasMenuBody } from "./EnvironmentallySensitiveAreasMenuBody";
import type { LayerControlProps } from "@/tools/Tool";

import ComplexLayerControl from "@/components/ComplexLayerControl";

export default function EnvironmentallySensitiveAreasLayerControl({
  searchQuery,
}: Readonly<LayerControlProps>) {
  return (
    <ComplexLayerControl title="Environmentally Sensitive Areas">
      <div className="menu menu-lg">
        <EnvironmentallySensitiveAreasMenuBody searchQuery={searchQuery} />
      </div>
    </ComplexLayerControl>
  );
}
