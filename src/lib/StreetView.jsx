import React from "react";
import { ReactComponent as GoogleMapIcon } from "./assets/google-map-icon.svg";

const StreetView = ({ latitude, longitude }) => {
  if (!latitude && !longitude) return null;

  const params = {
    api: 1,
    map_action: "pano",
    viewpoint: `${latitude},${longitude}`,
  };

  return (
    <div>
      <a
        href={`https://www.google.com/maps/@?${new URLSearchParams(params).toString()}`}
        target="_blank"
        rel="noreferrer"
        className="link"
      >
        <div className="flex items-center">
          <GoogleMapIcon /> Street View
        </div>
      </a>
      <div className="linkBorder" />
    </div>
  );
};

export default StreetView;
