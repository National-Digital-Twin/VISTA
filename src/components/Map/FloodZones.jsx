import React from "react";
import PropTypes from "prop-types";
import { isEmpty } from "lodash";

const FloodZones = ({ selectedFloodZones }) => {
  if (isEmpty(selectedFloodZones)) return null;

  return (
    <div>
      <h3 className="text-base">Selected flood zone areas</h3>
      <ul className="list-disc list-inside text-sm">
        {selectedFloodZones.map((selectedFloodZone) => {
          return (
            <li key={selectedFloodZone.properties.TA_NAME}>
              {selectedFloodZone.properties.TA_NAME}
            </li>
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
