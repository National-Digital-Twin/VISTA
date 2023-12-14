import React, { useContext, useEffect } from "react";
import PropTypes from "prop-types";
import { isEmpty } from "lodash";
import classNames from "classnames";

import { ElementsContext } from "context";

const FloodZones = ({ selectedFloodZones }) => {
  const { onFloodTimelineSelect, selectedTimeline, closeTimelinePanel } = useContext(ElementsContext);

  useEffect(() => {
    if (isEmpty(selectedFloodZones)) {
      closeTimelinePanel();
    }
  });

  if (isEmpty(selectedFloodZones)) return null;

  return (
    <div>
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
};
FloodZones.defaultProps = {
  selectedFloodZones: [],
};
FloodZones.propTypes = {
  selectedFloodZones: PropTypes.array,
};

export default FloodZones;

const FloodAreaListItem = ({ selectedFloodZone, selectedTimeline, onTimelineClick }) => (
  <li className="flex items-center justify-between pt-1">
    <p>{selectedFloodZone.properties.TA_NAME}</p>
    <button
      className={classNames("border border-black-400 rounded-lg ml-2 px-1 text-sm hover:bg-black-400", {
        "bg-black-400": selectedFloodZone === selectedTimeline,
      })}
      onClick={() => onTimelineClick(selectedFloodZone)}
    >
      view timeline
    </button>
  </li>
);
