import React, { useState } from "react";
import PropTypes from "prop-types";
import { Marker, Popup, Source } from "react-map-gl";

import { FEATURE_COLLECTION, GEOJSON } from "./TelicentMap";

const FloodMonitoringStations = ({ query, showStations }) => {
  const [selectedStation, setSelectedStation] = useState(undefined);
  const { data: features } = query;

  if (!features || !showStations) return null;

  const handleOnStationClick = (feature) => setSelectedStation(feature);
  const handleOnClosePopup = () => setSelectedStation(undefined);


  return (
    <Source id="flood-monitoring-stations" type={GEOJSON} data={{ type: FEATURE_COLLECTION, features: features }}>
      <StationIcons features={features} onStationClick={handleOnStationClick} />
      <StationPopup selectedStation={selectedStation} onClose={handleOnClosePopup} />
    </Source>
  );
};

FloodMonitoringStations.defaultProps = {
  showStations: false,
};
FloodMonitoringStations.propTypes = {
  showStations: PropTypes.bool,
};

export default FloodMonitoringStations;

const StationIcons = ({ features, onStationClick }) =>
  features.map((feature) => (
    <Marker
      key={feature.properties.id}
      longitude={feature.geometry.coordinates[0]}
      latitude={feature.geometry.coordinates[1]}
      onClick={() => onStationClick(feature)}
      style={{ cursor: "pointer" }}
    >
      <i className="fa-solid fa-arrow-up-from-ground-water fa-xl text-whiteSmoke" />
    </Marker>
  ));

const StationPopup = ({ selectedStation, onClose }) => {
  if (!selectedStation) return null;

  const getId = (id) => {
    const parts = id.split("/");
    return parts.at(-1);
  };

  return (
    <Popup
      longitude={selectedStation.geometry.coordinates[0]}
      latitude={selectedStation.geometry.coordinates[1]}
      anchor="bottom"
      onClose={onClose}
      closeOnClick={false}
      className="font-body text-sm"
      offset={[0, -8]}
    >
      <h4 className="mr-6 font-medium">Monitoring Station</h4>
      <p>{selectedStation.properties.label}</p>
      <a
        href={`https://environment.data.gov.uk/flood-monitoring/id/stations/${getId(
          selectedStation.properties.id
        )}.html`}
        target="_blank"
        rel="noreferrer"
        className="text-appColor flex items-center gap-x-1"
      >
        <i className="fa-solid fa-arrow-right fa-xs pt-1" />
        <span className="underline underline-offset-4">view details</span>
      </a>
    </Popup>
  );
};
