import React, { useState, useContext } from "react";
import { ElementsContext } from "../../context";
import SelectedElements from "./SelectedElements";
import { kebabCase } from "lodash";

const InfoPanel = () => {
  const [expand, setExpand] = useState(false);

  const { selectedDetails } = useContext(ElementsContext);

  const toggleView = () => {
    setExpand(!expand);
  };

  //expand is not maintaining the selected view - for now!

  if (!expand) {
    return (
      <div className="absolute top-0 right-0 z-10 bg-black-200 p-3  gap-y-2 ">
        <ExpandButton selectedDetails={selectedDetails} toggleView={toggleView} expand={expand} />
      </div>
    );
  }
  return (
    <div className="absolute top-0 right-0 z-10 bg-black-200 p-3 gap-y-2 w-2/5 overflow-y-auto" style={{ minHeight: "50%", height: "50%" }}>
      <div className="flex items-center justify-between border-b border-black-500">
        <h2 className="font-medium">Element Details</h2>
        <ExpandButton selectedDetails={selectedDetails} toggleView={toggleView} expand={expand} />
      </div>
      <div className="overflow-y-auto">
        <SelectedElements />
      </div>
    </div>
  );
};

const ExpandButton = ({ selectedDetails, toggleView, expand }) => {
  const label = `${!expand ? "close" : "open"} details panel`;
  return (
    <div className="relative flex justify-end">
      <button aria-labelledby={kebabCase(label)} className="relative" onClick={toggleView}>
        <i className="ri-information-line text-[color:var(--app-Colour)] !text-2xl" />
        <span className="absolute -top-1.5 -right-2 flex items-center justify-center w-5 h-5 rounded-full bg-whiteSmoke-300 text-black-200 text-sm">
          {selectedDetails.length}
        </span>
      </button>
      <div id={kebabCase(label)} role="tooltip" className="right-0">
        {label}
      </div>
    </div>
  );
};

export default InfoPanel;
