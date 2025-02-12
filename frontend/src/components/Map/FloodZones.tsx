import { useContext, useCallback } from "react";
import classNames from "classnames";

import type { Feature } from "geojson"; // ✅ Use standard GeoJSON Feature

import { ElementsContext } from "@/context/ElementContext";

export interface FloodZonesProps {
  /** Selected zones */
  readonly selectedFloodZones?: Feature[];
  /** Additional classes to add to the top-level element */
  readonly className?: string;
}

export default function FloodZones({
  selectedFloodZones = [],
  className,
}: FloodZonesProps) {
  const { onFloodTimelineSelect, selectedTimeline } =
    useContext(ElementsContext);

  const noZones = selectedFloodZones.length === 0;

  if (noZones) {
    return null;
  }

  return (
    <div className={className}>
      <h3 className="text-base">Selected flood zone areas</h3>
      <ul className="list-disc list-inside text-sm">
        {selectedFloodZones.map((selectedFloodZone) => (
          <FloodAreaListItem
            key={selectedFloodZone.properties?.TA_NAME} // ✅ Added optional chaining
            selectedFloodZone={selectedFloodZone}
            selectedTimeline={selectedTimeline}
            onTimelineClick={onFloodTimelineSelect}
          />
        ))}
      </ul>
    </div>
  );
}

interface FloodAreaListItemProps {
  readonly selectedFloodZone: Feature;
  readonly selectedTimeline: Feature;
  readonly onTimelineClick: (zone: Feature) => void;
}

function FloodAreaListItem({
  selectedFloodZone,
  selectedTimeline,
  onTimelineClick,
}: FloodAreaListItemProps) {
  const onClick = useCallback(
    () => onTimelineClick(selectedFloodZone),
    [onTimelineClick, selectedFloodZone],
  );

  return (
    <li className="flex items-center justify-between pt-1">
      <p>{selectedFloodZone.properties?.TA_NAME}</p>{" "}
      {/* ✅ Added optional chaining */}
      <button
        className={classNames(
          "border border-black-400 rounded-lg ml-2 px-1 text-sm hover:bg-black-400",
          {
            "bg-black-400": selectedFloodZone === selectedTimeline,
          },
        )}
        onClick={onClick}
      >
        view timeline
      </button>
    </li>
  );
}
