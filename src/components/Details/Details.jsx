import React, { useState } from "react";
import PropTypes from "prop-types";
import Accordion from "../../lib/Accordion";
import { IsEmpty } from "../../utils";
import { AssetElement, ConnectionElement } from "./ConnectionElement";
import "./Details.css";
import { ReactComponent as GoogleMapIcon } from "./assets/google-map-icon.svg";

const Details = ({ element }) => {
  if (IsEmpty(element)) return <p>Click on an asset or connection to view details</p>;

  const { category } = element;
  const item = category === "asset" ? new AssetElement(element) : new ConnectionElement(element);
  const { desc, title, id, longitude, latitude, connectedAssets, titleClassName, totalConnections } = item;

  return (
    <div className="overflow-auto">
      <div className="grid gap-y-2">
        <h2 className={`text-xl ${titleClassName}`}>{title}</h2>
        <div className="flex justify-between">
          <div>
            <p id="asset-id">ID: {id}</p>
            <p>Criticality: {item.criticality}</p>
          </div>
          <StreetView latitude={latitude} longitude={longitude} />
        </div>
        <Description desc={desc} />
        <ConnectedAssets input={connectedAssets} totalConnections={totalConnections} />
      </div>
    </div>
  );
};

const StreetView = ({ latitude, longitude }) => {
  const params = {
    api: 1,
    map_action: "pano",
    viewpoint: `${latitude},${longitude}`,
  };

  return (
    <div className="w-fit flex items-center justify-center gap-x-1">
      <GoogleMapIcon />
      <div>
        <a
          href={`https://www.google.com/maps/@?${new URLSearchParams(params).toString()}`}
          target="_blank"
          rel="noreferrer"
          className="link"
        >
          Open street view
        </a>
        <div className="linkBorder" />
      </div>
    </div>
  );
};

const Description = ({ desc }) => {
  const [show, setShow] = useState(true);

  const toggleSection = (e) => {
    e.preventDefault();
    setShow((prev) => !prev);
  };

  if (!desc) {
    return null;
  }
  return (
    <Accordion title="Drescription" show={show} onToggle={toggleSection}>
      <p>{desc}</p>
    </Accordion>
  );
};

const ConnectedAssets = ({ input, totalConnections }) => {
  const [show, setShow] = useState(true);

  const toggleSection = (e) => {
    e.preventDefault();
    setShow((prev) => !prev);
  };

  if (IsEmpty(input)) {
    return null;
  }
  return (
    <Accordion
      title="Connected Assets"
      show={show}
      onToggle={toggleSection}
      subTitle={`Connections: ${totalConnections}`}
    >
      <div>
        <ul>
          {input.map((input) => (
            <div key={input.id}>
              <li className="grid grid-rows-2 border-b pb-2">
                <div className="flex gap-x-2 items-center">
                  <div style={{ backgroundColor: `${input.colour}` }} className="w-2 h-2 rounded-full" />
                  <h2>Name: {input.name}</h2>
                </div>
                <div className="grid grid-flow-col auto-cols-min gap-x-6">
                  <p className="whitespace-nowrap">ID: {input.id}</p>
                  <p className="whitespace-nowrap">Criticality: {input.criticality}</p>
                  {input.connCriticality && (
                    <p className="whitespace-nowrap">Connection Criticality: {input.connCriticality}</p>
                  )}
                </div>
              </li>
            </div>
          ))}
        </ul>
      </div>
    </Accordion>
  );
};

export default Details;

Details.defaultProps = {
  element: {},
};

Details.propTypes = {
  element: PropTypes.object,
};

StreetView.defaultProps = {
  latitude: [],
  longitude: [],
};
