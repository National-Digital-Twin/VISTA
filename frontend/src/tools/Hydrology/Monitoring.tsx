import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSignal,
  faTint,
  faWater,
  faStream,
  faWaterLadder,
} from "@fortawesome/free-solid-svg-icons";
import { useCallback } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";

import useStore from "./useStore";
import type { StationType } from "@/api/hydrology";
import { STATION_TYPES } from "@/api/hydrology";
import ToolbarDropdown from "@/components/ToolbarDropdown";
import featureFlags from "@/config/feature-flags";

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

/** Controls for flood monitoring stations */
export default function Monitoring() {
  if (featureFlags.uiNext) {
    return;
  }

  return (
    <ToolbarDropdown icon={faSignal} title="Monitoring">
      {STATION_MENU_ITEMS.map((stationType) => (
        <MonitoringStationTypeButton
          key={stationType.type}
          label={stationType.label}
          icon={stationType.icon}
          type={stationType.type}
        />
      ))}
    </ToolbarDropdown>
  );
}

interface MonitoringStationTypeButtonProps {
  readonly type: StationType;
  readonly icon: IconDefinition;
  readonly label: string;
}

function MonitoringStationTypeButton({
  type,
  icon,
  label,
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
  );
}
