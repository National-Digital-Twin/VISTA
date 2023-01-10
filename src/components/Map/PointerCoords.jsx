import React from "react";

const PointerCoordinates = ({ show, lat, lng }) => {
  if (!show || (!lat && !lng)) return null;
  return (
    <div id="pointer-coordinates" className="absolute top-0 left-0 bg-black-200 p-1 flex items-center gap-x-2">
      <div className="uppercase border w-fit px-2">lat, lng</div>
      <p className="text-xs">
        {lat}, {lng}
      </p>
    </div>
  );
};
export default PointerCoordinates;
