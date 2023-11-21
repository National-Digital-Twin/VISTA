import React, { useState } from "react";
import PropTypes from "prop-types";
import { Marker, Popup, Source } from "react-map-gl";

import { FEATURE_COLLECTION, GEOJSON } from "./TelicentMap";
import { Modal } from "lib";
import useSupercluster from "use-supercluster";

const epcColourLookup = {
  A: "text-[#0B8647]",
  B: "text-[#2DA847]",
  C: "text-[#95CA53]",
  D: "text-[#F0EB35]",
  E: "text-[#F6AE36]",
  F: "text-[#EF6F2E]",
  G: "text-[#E92731]",
};

const BuildingsEpcRating = ({ map, query, showBuildings }) => {
  const [selectedBuilding, setSelectedBuilding] = useState(undefined);
  const { data: features, isLoading } = query;

  const bounds = map ? map.getMap().getBounds().toArray().flat() : null;
  const zoom = map ? map.getZoom() : null;

  const { clusters } = useSupercluster({
    points: features ?? [],
    zoom,
    bounds,
    options: { radius: 30, maxZoom: 20 },
  });

  const handleOnStationClick = (feature) => setSelectedBuilding(feature);
  const handleOnClosePopup = () => setSelectedBuilding(undefined);

  if (isLoading)
    return (
      <Modal appElement="root" isOpen={isLoading} className="py-2 px-6 rounded-lg">
        <p>Loading data</p>
      </Modal>
    );
  if (!clusters || !showBuildings) return null;
  return (
    <Source id="buildings-epc-rating" type={GEOJSON} data={{ type: FEATURE_COLLECTION, features }}>
      <BuildingIcons clusters={clusters} features={features} onStationClick={handleOnStationClick} />
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

const BuildingIcons = ({ clusters, features, onStationClick }) => {
  if (!clusters) return null;

  return clusters.map((cluster) => {
    const [long, lat] = cluster.geometry.coordinates;
    const { cluster: isCluster, id, epcLetter } = cluster.properties;

    if (isCluster) {
      const { point_count: pointCount, cluster_id } = cluster.properties;
      const size = Math.round(30 + (pointCount / features.length) * 30);
      return (
        <Marker key={`cluster-${cluster_id}`} longitude={long} latitude={lat} style={{ cursor: "pointer" }}>
          <div
            className="bg-whiteSmoke text-black-50 rounded-full flex justify-center items-center"
            style={{ width: `${size}px`, height: `${size}px` }}
          >
            {pointCount}
          </div>
        </Marker>
      );
    }

    return (
      <Marker
        key={id}
        longitude={long}
        latitude={lat}
        onClick={() => onStationClick(cluster)}
        style={{ cursor: "pointer" }}
      >
        <i className={`ri-home-3-line ${epcColourLookup[epcLetter]}`} />
      </Marker>
    );
  });
};

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
      <p>UPRN: {selectedBuilding.properties.id}</p>
      <p>EPC: {selectedBuilding.properties.epcLetter}</p>
    </Popup>
  );
};
