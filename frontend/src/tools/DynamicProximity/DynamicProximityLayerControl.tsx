import { useCallback } from "react";
import useDynamicProximity from "./useDynamicProximity";
import ComplexLayerControl from "@/components/ComplexLayerControl";
import SearchConditional from "@/components/SearchConditional";
import type { LayerControlProps } from "@/tools/Tool";

export default function DynamicProximityLayerControl({
  searchQuery,
}: Readonly<LayerControlProps>) {
  return (
    <SearchConditional
      searchQuery={searchQuery}
      terms={["dynamic proximity", "radius", "circle", "km"]}
    >
      <ComplexLayerControl title="Dynamic proximity">
        <DynamicProximityControlPanelBody />
      </ComplexLayerControl>
    </SearchConditional>
  );
}

function DynamicProximityControlPanelBody() {
  return (
    <div className="menu menu-lg">
      {[1, 2, 3].map((radiusKm) => (
        <DynamicProximityMenuItem key={radiusKm} radiusKm={radiusKm} />
      ))}
    </div>
  );
}

interface DynamicProximityMenuItemProps {
  readonly radiusKm: number;
  readonly onClick?: () => void;
}

function DynamicProximityMenuItem({
  radiusKm,
  onClick,
}: DynamicProximityMenuItemProps) {
  const { startDrawingWithRange } = useDynamicProximity();

  const clicked = useCallback(() => {
    startDrawingWithRange(radiusKm);
    onClick?.();
  }, [radiusKm, onClick, startDrawingWithRange]);

  return (
    <button className="menu-item" role="menuitem" onClick={clicked}>
      {radiusKm}km radius
    </button>
  );
}
