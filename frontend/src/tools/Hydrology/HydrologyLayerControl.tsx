import {
  faWater,
  faTint,
  faStream,
  faWaterLadder,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";

import { useCallback } from "react";
import useStore from "./useStore";

import type { StationType } from "@/api/hydrology";
import { STATION_TYPES } from "@/api/hydrology";
import ComplexLayerControl from "@/components/ComplexLayerControl";
import type { LayerControlProps } from "@/tools/Tool";
import SearchConditional from "@/components/SearchConditional";

const STATION_MENU_ITEMS = [
  { type: STATION_TYPES.RainfallStation, label: "Rainfall", icon: faTint },
  { type: STATION_TYPES.RiverFlow, label: "River flow", icon: faStream },
  { type: STATION_TYPES.RiverLevel, label: "River level", icon: faWater },
  {
    type: STATION_TYPES.Groundwater,
    label: "Groundwater level",
    icon: faWaterLadder,
  },
  {
    type: STATION_TYPES.GroundwaterDippedOnly,
    label: "Groundwater level (dipped only)",
    icon: faWaterLadder,
  },
];

export default function HydrologyLayerControl({
  searchQuery,
}: LayerControlProps) {
  return (
    <ComplexLayerControl
      icon={faWater}
      title="Hydrology monitoring"
      autoShowHide
    >
      <MonitoringStationControlPanelBody searchQuery={searchQuery} />
    </ComplexLayerControl>
  );
}

interface MonitoringStationControlPanelBodyProps {
  searchQuery: string;
}

function MonitoringStationControlPanelBody({
  searchQuery,
}: MonitoringStationControlPanelBodyProps) {
  return (
    <div className="menu menu-lg">
      {STATION_MENU_ITEMS.map((menuItem) => (
        <MonitoringStationTypeButton
          type={menuItem.type}
          icon={menuItem.icon}
          label={menuItem.label}
          key={menuItem.type}
          searchQuery={searchQuery}
        />
      ))}
    </div>
  );
}

interface MonitoringStationTypeButtonProps {
  type: StationType;
  icon: IconDefinition;
  label: string;
  searchQuery: string;
}

function MonitoringStationTypeButton({
  type,
  icon,
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
    <SearchConditional
      searchQuery={searchQuery}
      terms={["hydrology", "monitoring", "water", label]}
    >
      <button
        key={type}
        className="menu-item"
        data-selected={isStationTypeSelected}
        role="menuitem"
        onClick={onToggle}
      >
        <FontAwesomeIcon icon={icon} className="mr-2" />
        {label}
      </button>
    </SearchConditional>
  );
}
