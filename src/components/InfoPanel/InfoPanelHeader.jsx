import { kebabCase } from "lodash";
import React from "react";

import InfoBtn from "./InfoBtn";
import { ReactComponent as GoogleMapIcon } from "./assets/google-map-icon.svg";
import { VerticalDivider } from "../../lib";

const InfoPanelHeader = ({ count, latitude, longitude, title, viewAll, onToggle, onViewAll }) => {
  
  return (
    <div className="flex items-center gap-x-2 border-b border-black-500 pb-1">
      {title && <h2 className="font-medium">{title}</h2>}
      {viewAll && (
        <button onClick={onViewAll} className="flex items-center">
          <span role="img" className="ri-arrow-left-s-line" />
          {viewAll}
        </button>
      )}
      <div className="flex items-center gap-x-2 ml-auto">
        <StreetView latitude={latitude} longitude={longitude} />
        <VerticalDivider height="h-5" />
        <InfoBtn active count={count} onToggle={onToggle} />
      </div>
    </div>
  );
};
export default InfoPanelHeader;

const StreetView = ({ latitude, longitude }) => {
  const label = "Open street view";
  if (!latitude && !longitude) return null;

  const params = {
    api: 1,
    map_action: "pano",
    viewpoint: `${latitude},${longitude}`,
  };

  return (
    <div className="relative w-fit">
      <a
        href={`https://www.google.com/maps/@?${new URLSearchParams(params).toString()}`}
        target="_blank"
        rel="noreferrer"
        aria-labelledby={kebabCase(label)}
      >
        <GoogleMapIcon />
      </a>
      <div id={kebabCase(label)} role="tooltip" className="right-0">
        {label}
      </div>
    </div>
  );
};
