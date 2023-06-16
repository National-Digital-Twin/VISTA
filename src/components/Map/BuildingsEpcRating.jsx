import React, { useState } from "react";
import PropTypes from "prop-types";
import { Marker, Popup, Source } from "react-map-gl";

import { FEATURE_COLLECTION, GEOJSON } from "./TelicentMap";
import { Modal } from "lib";

const epcColourLookup = {
  A: "text-[#0B8647]",
  B: "text-[#2DA847]",
  C: "text-[#95CA53]",
  D: "text-[#F0EB35]",
  E: "text-[#F6AE36]",
  F: "text-[#EF6F2E]",
  G: "text-[#E92731]",
};

const BuildingsEpcRating = ({ query, showBuildings }) => {
  const [selectedBuilding, setSelectedBuilding] = useState(undefined);

  const { data: features, isLoading } = query;

  const handleOnStationClick = (feature) => setSelectedBuilding(feature);
  const handleOnClosePopup = () => setSelectedBuilding(undefined);

  if (isLoading)
    return (
      <Modal appElement="root" isOpen={isLoading} className="py-2 px-6 rounded-lg">
        <p>Loading data</p>
      </Modal>
    );
  if (!features || !showBuildings) return null;
  return (
    <Source id="buildings-epc-rating" type={GEOJSON} data={{ type: FEATURE_COLLECTION, features: features }}>
      <BuildingIcons features={features} onStationClick={handleOnStationClick} />
      <BuildingPopup selectedBuilding={selectedBuilding} onClose={handleOnClosePopup} />
    </Source>
  );
};

BuildingsEpcRating.defaultProps = {
  showStations: false,
};
BuildingsEpcRating.propTypes = {
  showStations: PropTypes.bool,
};

export default BuildingsEpcRating;

const BuildingIcons = ({ features, onStationClick }) =>
  features.map((feature) => (
    <Marker
      key={feature.properties.id}
      longitude={feature.geometry.coordinates[0]}
      latitude={feature.geometry.coordinates[1]}
      onClick={() => onStationClick(feature)}
      style={{ cursor: "pointer" }}
    >
      <i className={`ri-home-3-line ${epcColourLookup[feature.properties.epc_letter]}`} />
    </Marker>
  ));

const BuildingPopup = ({ selectedBuilding, onClose }) => {
  if (!selectedBuilding) return null;

  const getEPCLetter = (str) => {
    const epcLetter = str.charAt(str.length - 1);
    return epcLetter;
  };

  return (
    <Popup
      longitude={selectedBuilding.geometry.coordinates[0]}
      latitude={selectedBuilding.geometry.coordinates[1]}
      anchor="bottom"
      onClose={onClose}
      closeOnClick={false}
      className="font-body text-sm"
      offset={[0, -8]}
    >
      <h4 className="mr-6 font-medium">Building EPC Details</h4>
      <p>{selectedBuilding.properties.label}</p>
      <p>EPC: {selectedBuilding.properties.epc_letter}</p>
    </Popup>
  );
};
