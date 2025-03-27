import { useCallback } from "react";
import { faDrawPolygon } from "@fortawesome/free-solid-svg-icons";
import useDynamicProximity from "./useDynamicProximity";
import ComplexLayerControl from "@/components/ComplexLayerControl";
import SearchConditional from "@/components/SearchConditional";
import type { LayerControlProps } from "@/tools/Tool";
import MenuItemRow from "@/components/MenuItemRow";

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
    <div>
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
    <MenuItemRow
      primaryText={`${radiusKm}km radius`}
      checked={false}
      searchQuery=""
      terms={[`${radiusKm}km radius`]}
      buttons={[
        {
          icon: faDrawPolygon,
          name: `${radiusKm}km radius`,
          onClick: clicked,
        },
      ]}
    />
  );
}
