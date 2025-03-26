import { useCallback } from "react";
import useStore from "./useStore";

import type { StationType } from "@/api/hydrology";
import { STATION_TYPES } from "@/api/hydrology";
import ComplexLayerControl from "@/components/ComplexLayerControl";
import type { LayerControlProps } from "@/tools/Tool";
import MenuItemRow from "@/components/MenuItemRow";

const STATION_MENU_ITEMS = [
  { type: STATION_TYPES.RainfallStation, label: "Rainfall" },
  { type: STATION_TYPES.RiverFlow, label: "River flow" },
  { type: STATION_TYPES.RiverLevel, label: "River level" },
  {
    type: STATION_TYPES.Groundwater,
    label: "Groundwater level",
  },
  {
    type: STATION_TYPES.GroundwaterDippedOnly,
    label: "Groundwater level (dipped only)",
  },
];

export default function HydrologyLayerControl({
  searchQuery,
}: Readonly<LayerControlProps>) {
  const complexLayerMatches =
    !searchQuery ||
    "Hydrology monitoring".toLowerCase().includes(searchQuery.toLowerCase()) ||
    ["hydrology", "monitoring", "water"].some((term) =>
      term.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const anyStationMatches =
    !searchQuery ||
    STATION_MENU_ITEMS.some((item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  if (!complexLayerMatches && !anyStationMatches) {
    return null;
  }

  return (
    <ComplexLayerControl title="Hydrology monitoring" autoShowHide>
      <MonitoringStationControlPanelBody searchQuery={searchQuery} />
    </ComplexLayerControl>
  );
}

interface MonitoringStationControlPanelBodyProps {
  readonly searchQuery: string;
}

function MonitoringStationControlPanelBody({
  searchQuery,
}: MonitoringStationControlPanelBodyProps) {
  return (
    <div>
      {STATION_MENU_ITEMS.map((menuItem) => (
        <MonitoringStationTypeButton
          type={menuItem.type}
          label={menuItem.label}
          key={menuItem.type}
          searchQuery={searchQuery}
        />
      ))}
    </div>
  );
}

interface MonitoringStationTypeButtonProps {
  readonly type: StationType;
  readonly label: string;
  readonly searchQuery: string;
}

function MonitoringStationTypeButton({
  type,
  label,
  searchQuery,
}: MonitoringStationTypeButtonProps) {
  const selectedStationTypes = useStore((state) => state.selectedStationTypes);
  const toggleSelectedStationType = useStore(
    (state) => state.toggleSelectedStationType,
  );

  const isStationTypeSelected = !!selectedStationTypes[type];

  const onToggle = useCallback(() => {
    toggleSelectedStationType(type);
  }, [type, toggleSelectedStationType]);

  return (
    <MenuItemRow
      primaryText={label}
      checked={isStationTypeSelected}
      onChange={onToggle}
      searchQuery={searchQuery}
      terms={["hydrology", "monitoring", "water", label]}
    />
  );
}
