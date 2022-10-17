import React from "react";
import SelectedElements from "./SelectedElements";

const InfoPanel = () => {
  return (
    <div className="grid grid-flow-row auto-rows-min overflow-auto gap-y-2">
      <SelectedElements />
    </div>
  );
};

export default InfoPanel;
