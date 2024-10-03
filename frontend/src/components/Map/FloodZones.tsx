import { useContext, useCallback } from "react";
import classNames from "classnames";

import type { MapboxGeoJSONFeature } from "react-map-gl";

import { ElementsContext } from "@/context/ElementContext";

export interface FloodZonesProps {
  /** Selected zones */
  selectedFloodZones?: MapboxGeoJSONFeature[];
  /** Additional classes to add to the top-level element */
  className?: string;
}

export default function FloodZones({
  selectedFloodZones = [],
  className,
}: FloodZonesProps) {
  const { onFloodTimelineSelect, selectedTimeline } =
    useContext(ElementsContext);

  const noZones = selectedFloodZones.length === 0;

  // This causes a render loop
  // TODO: Find a better way of closing the timeline panel when there are no zones
  // useEffect(() => {
  //   if (noZones) {
  //     closeTimelinePanel();
  //   }
  // }, [closeTimelinePanel, noZones]);

  if (noZones) {
    return null;
  }

  return (
    <div className={className}>
      <h3 className="text-base">Selected flood zone areas</h3>
      <ul className="list-disc list-inside text-sm">
        {selectedFloodZones.map((selectedFloodZone) => (
          <FloodAreaListItem
            key={selectedFloodZone.properties.TA_NAME}
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
  selectedFloodZone: MapboxGeoJSONFeature;
  selectedTimeline: MapboxGeoJSONFeature;
  onTimelineClick: (zone: MapboxGeoJSONFeature) => void;
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
      <p>{selectedFloodZone.properties.TA_NAME}</p>
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
