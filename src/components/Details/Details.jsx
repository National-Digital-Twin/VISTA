import React from "react";
import PropTypes from "prop-types";
import { IsEmpty } from "../../utils";
import { AssetElement, ConnectionElement } from "./ConnectionElement";
import "./Details.css";

const Details = ({ element }) => {
  if (IsEmpty(element)) return <p>Click on an asset or connection to view details</p>;

  const { category } = element;

  const item = category === "asset" ? new AssetElement(element) : new ConnectionElement(element);

  const {
    asset,
    connLink,
    connPrefix,
    connSourceName,
    connSourceStyle,
    connTargetName,
    connTargetStyle,
    desc,
    title,
    titleStyle,
    titleClassName,
  } = item;

  return (
    <>
      <Header
        id={title}
        latitude={asset.lat}
        longitude={asset.lon}
        title={item.name}
        titleStyle={titleStyle}
        type={category}
        connectionStyle={titleClassName}
      />
      {category === "connection" && (
        <p id="connection-details">
          {connPrefix}
          <span style={connSourceStyle}>{connSourceName}</span>
          {connLink}
          <span style={connTargetStyle}>{connTargetName}</span>
        </p>
      )}
      {desc && <span>{desc}</span>}
    </>
  );
};

export default Details;

Details.defaultProps = {
  element: {},
};

Details.propTypes = {
  element: PropTypes.object,
};

const Header = ({ id, latitude, longitude, title, titleStyle, type, connectionStyle }) => {
  if (type === "connection") return <h2 className={`text-xl ${connectionStyle}`}>{id}</h2>;

  const params = {
    api: 1,
    map_action: "pano",
    viewpoint: `${latitude},${longitude}`,
  };

  return (
    <>
      <div className="flex justify-between">
        <h2 className="text-xl" style={{ color: titleStyle.color }}>
          {title}
        </h2>
        <div className="w-fit flex items-center justify-center gap-x-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            width="22"
            height="22"
            viewBox="0 0 48 48"
            style={{ fill: "#000000" }}
          >
            <path
              fill="#48b564"
              d="M35.76,26.36h0.01c0,0-3.77,5.53-6.94,9.64c-2.74,3.55-3.54,6.59-3.77,8.06	C24.97,44.6,24.53,45,24,45s-0.97-0.4-1.06-0.94c-0.23-1.47-1.03-4.51-3.77-8.06c-0.42-0.55-0.85-1.12-1.28-1.7L28.24,22l8.33-9.88	C37.49,14.05,38,16.21,38,18.5C38,21.4,37.17,24.09,35.76,26.36z"
            ></path>
            <path
              fill="#fcc60e"
              d="M28.24,22L17.89,34.3c-2.82-3.78-5.66-7.94-5.66-7.94h0.01c-0.3-0.48-0.57-0.97-0.8-1.48L19.76,15	c-0.79,0.95-1.26,2.17-1.26,3.5c0,3.04,2.46,5.5,5.5,5.5C25.71,24,27.24,23.22,28.24,22z"
            ></path>
            <path
              fill="#2c85eb"
              d="M28.4,4.74l-8.57,10.18L13.27,9.2C15.83,6.02,19.69,4,24,4C25.54,4,27.02,4.26,28.4,4.74z"
            ></path>
            <path
              fill="#ed5748"
              d="M19.83,14.92L19.76,15l-8.32,9.88C10.52,22.95,10,20.79,10,18.5c0-3.54,1.23-6.79,3.27-9.3	L19.83,14.92z"
            ></path>
            <path
              fill="#5695f6"
              d="M28.24,22c0.79-0.95,1.26-2.17,1.26-3.5c0-3.04-2.46-5.5-5.5-5.5c-1.71,0-3.24,0.78-4.24,2L28.4,4.74	c3.59,1.22,6.53,3.91,8.17,7.38L28.24,22z"
            ></path>
          </svg>
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
      </div>
      <p id="asset-id">
        ID: <span style={{ color: titleStyle.color }}>{id}</span>
      </p>
    </>
  );
};

Header.defaultProps = {
  latitude: [],
  longitude: [],
};

Header.propTypes = {
  id: PropTypes.string.isRequired,
  latitude: PropTypes.array,
  longitude: PropTypes.array,
  title: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
};
