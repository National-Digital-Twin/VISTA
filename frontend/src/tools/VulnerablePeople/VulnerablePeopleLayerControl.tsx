import { faPersonWalkingWithCane } from "@fortawesome/free-solid-svg-icons";
import VulnerablePeopleControls from "./VulnerablePeopleControls";
import ComplexLayerControl from "@/components/ComplexLayerControl";
import { LayerControlProps } from "@/tools/Tool";

export default function VulnerablePeopleLayerControl({
  searchQuery,
}: LayerControlProps) {
  void searchQuery;

  return (
    <ComplexLayerControl
      icon={faPersonWalkingWithCane}
      title="Vulnerable People"
    >
      <div className="menu">
        <VulnerablePeopleControls />
      </div>
    </ComplexLayerControl>
  );
}
