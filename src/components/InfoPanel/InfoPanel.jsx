import React from "react";
import SelectedElements from "./SelectedElements";

const InfoPanel = () => {
  return (
    <div className="absolute top-0 right-0 z-10 bg-black-200 p-3 grid grid-flow-row auto-rows-min overflow-auto gap-y-2">
      <SelectedElements />
    </div>
  );
};

export default InfoPanel;
