import type { MapRef } from "react-map-gl";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

import { useCallback } from "react";
import useDynamicProximity from "./useDynamicProximity";

import featureFlags from "@/config/feature-flags";
import ToolbarDropdown from "@/components/ToolbarDropdown";

export interface DynamicProximityProps {
  map: MapRef;
}

/* This is not used in the app currently */
export default function DynamicProximity() {
  if (featureFlags.uiNext) {
    return null;
  }

  return (
    <ToolbarDropdown icon={faPlus} title="Add Dynamic Proximity" large>
      {({ toggle }) =>
        [1, 2, 3].map((radiusKm) => (
          <DynamicProximityMenuItem
            key={radiusKm}
            radiusKm={radiusKm}
            onClick={toggle}
          />
        ))
      }
    </ToolbarDropdown>
  );
}

interface DynamicProximityMenuItemProps {
  readonly radiusKm: number;
  readonly onClick: () => void;
}

function DynamicProximityMenuItem({
  radiusKm,
  onClick,
}: DynamicProximityMenuItemProps) {
  const { startDrawingWithRange } = useDynamicProximity();

  const clicked = useCallback(() => {
    startDrawingWithRange(radiusKm);
    onClick();
  }, [radiusKm, onClick, startDrawingWithRange]);

  return (
    <button className="menu-item" role="menuitem" onClick={clicked}>
      {radiusKm}km radius
    </button>
  );
}
