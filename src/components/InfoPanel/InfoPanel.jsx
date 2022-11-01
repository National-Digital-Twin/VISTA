import React, { useState, useContext } from "react";
import { ElementsContext } from "../../context";
import SelectedElements from "./SelectedElements";
import { kebabCase } from "lodash";
import { ReactComponent as GoogleMapIcon } from "./assets/google-map-icon.svg";
import { useEffect } from "react";
import VerticalDivider from "../../lib/VerticalDivider";

const viewType = {
  hasSingleItem: "singleItem",
  hasMultipleItems: "multipleItems",
};

const InfoPanel = () => {
  const [expand, setExpand] = useState(false);
  const { selectedDetails } = useContext(ElementsContext);
  const [selected, setSelected] = useState();
  const [view, setView] = useState(viewType.hasMultipleItems);

  useEffect(() => {
    if (selectedDetails.length === 1) {
      setView(viewType.hasSingleItem);
      setSelected(selectedDetails[0]);
      return;
    }
    setView(viewType.hasMultipleItems);
    setSelected(selectedDetails);
  }, [selectedDetails]);

  const toggleView = () => {
    setExpand(!expand);
  };

  const handleViewSelected = (index) => {
    setView(viewType.hasSingleItem);
    setSelected(selectedDetails[index]);
  };

  const handleBackButton = () => {
    setView(viewType.hasMultipleItems);
    setSelected(selectedDetails);
  };

  if (!expand) {
    return (
      <div className="absolute top-0 right-0 z-10 bg-black-200 p-3  gap-y-2 ">
        <ExpandButton selected={selectedDetails} toggleView={toggleView} expand={expand} />
      </div>
    );
  }
  return (
    <div
      className="absolute top-0 right-0 z-10 bg-black-200 p-3 gap-y-2 w-2/5 overflow-y-auto"
      style={{ minHeight: "50%", height: "50%" }}
    >
      <div className=" z-10 flex items-center justify-end border-b border-black-500 gap-x-2 ">
        <Toolbar selectedDetails={selectedDetails} selected={selected} onBack={handleBackButton} view={view} />
        <VerticalDivider />
        <ExpandButton selected={selectedDetails} toggleView={toggleView} expand={expand} />
      </div>
      <div className="overflow-y-auto">
        <SelectedElements selected={selected} handleViewSelected={handleViewSelected} view={view} />
      </div>
    </div>
  );
};

const Toolbar = ({ selected, onBack, selectedDetails, view, toggleView, expand }) => {
  if (view === "singleItem" && selectedDetails.length > 1) {
    return (
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-x-1 mr-auto">
          <span role="img" className="ri-arrow-left-s-line" />
          view all selected
        </button>
        <StreetView latitude={selected.lat} longitude={selected.lng} />
      </div>
    );
  }

  if (view === "singleItem") {
    return (
      <div className="flex items-center justify-around">
        <h2 className="font-medium text-lg">Element Details</h2>
        <div className="flex items-center">
          <StreetView latitude={selected.lat} longitude={selected.lng} />
        </div>
      </div>
    );
  }
  return <h2 className="font-medium text-lg">Element Details</h2>;
};

const ExpandButton = ({ selected, toggleView, expand }) => {
  const label = `${!expand ? "close" : "open"} details panel`;
  return (
    <div className="relative flex justify-end">
      <button aria-labelledby={kebabCase(label)} className="relative" onClick={toggleView}>
        <i className="ri-information-line text-[color:var(--app-Colour)] !text-2xl" />
        {selected.length > 0 && (
          <span className="absolute -top-1.5 -right-2 flex items-center justify-center w-5 h-5 rounded-full bg-whiteSmoke-300 text-black-200 text-sm">
            {selected.length}
          </span>
        )}
      </button>
      <div id={kebabCase(label)} role="tooltip" className="right-0">
        {label}
      </div>
    </div>
  );
};

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
        <GoogleMapIcon />
      </a>
      <div className="linkBorder" />
    </div>
  );
};

export default InfoPanel;
