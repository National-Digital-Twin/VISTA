import React from "react";

import Details from "../Details/Details";
import TelicentMap from "../Map/TelicentMap";

const DataPresentation = () => {
  return (
    <div style={{ width: "45%" }} className="grid grid-rows-2 gap-y-3 h-100 p-4">
      <Details />
      <TelicentMap />
    </div>
  );
};

export default DataPresentation;
