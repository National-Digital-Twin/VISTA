import React from "react";
import ReactSwitch from "react-switch";

import Dataset from "../Dataset/Dataset";

const ActionsPanel = ({ showGrid, toggleView }) => {
  return (
    <div className="absolute top-0 flex flex-col gap-y-4 p-3 bg-black-200 z-10">
      <label className="flex items-center gap-x-3 text-sm w-fit">
        Grid
        <ReactSwitch
          onChange={toggleView}
          checked={showGrid}
          offColor="#636363"
          onColor="#f5f5f5"
          onHandleColor="#141414"
          handleDiameter={10}
          height={16}
          width={32}
          uncheckedIcon={false}
          checkedIcon={false}
        />
      </label>
      <Dataset />
    </div>
  );
};

export default ActionsPanel;
