import React from "react";
import InfoPanel from "../InfoPanel/InfoPanel";
import TelicentMap from "../Map/TelicentMap";

const DataPresentation = () => {
  return (
    <div style={{ width: "45%" }} className="grid grid-rows-2 gap-y-3 h-100 p-4">
      <InfoPanel />
      <TelicentMap />
    </div>
  );
};

export default DataPresentation;
