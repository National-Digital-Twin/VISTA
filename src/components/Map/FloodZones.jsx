import React, { useContext, useEffect } from "react";
import PropTypes from "prop-types";
import { isEmpty } from "lodash";
import { ElementsContext } from "context";
import classNames from "classnames";

const FloodZones = ({ selectedFloodZones }) => {
  const { onFloodTimelineSelect, selectedTimeline } = useContext(ElementsContext);

  useEffect(() => {
    if (isEmpty(selectedFloodZones)) {
      onFloodTimelineSelect(null);
    }
    return;
  }, [onFloodTimelineSelect, selectedFloodZones]);

  if (isEmpty(selectedFloodZones)) return null;

  return (
    <div>
      <h3 className="text-base">Selected flood zone areas</h3>
      <ul className="list-disc list-inside text-sm">
        {selectedFloodZones.map((selectedFloodZone) => {
          return (
            <div className="flex items-center justify-between pt-1">
              <li key={selectedFloodZone.properties.TA_NAME}>{selectedFloodZone.properties.TA_NAME}</li>
              <button
                className={classNames("border border-black-400 rounded-lg ml-2 px-1 text-sm hover:bg-black-400", {
                  "bg-black-400": selectedFloodZone === selectedTimeline,
                })}
                onClick={() => onFloodTimelineSelect(selectedFloodZone)}
              >
                view timeline
              </button>
            </div>
          );
        })}
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
