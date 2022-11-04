import React from "react";
import { ReactComponent as GoogleMapIcon } from "./assets/google-map-icon.svg";

const StreetView = ({ selected }) => {
  if (!selected.lat && !selected.lng) return null;

  const params = {
    api: 1,
    map_action: "pano",
    viewpoint: `${selected.lat},${selected.lng}`,
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
          <GoogleMapIcon />
        </div>
      </a>
    </div>
  );
};

export default StreetView;
