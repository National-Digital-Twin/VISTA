import React, { useState, useContext } from "react";
import { ElementsContext } from "../../context";
import SelectedElements from "./SelectedElements";
import { kebabCase } from "lodash";
import { ReactComponent as GoogleMapIcon } from "./assets/google-map-icon.svg";
import { useEffect } from "react";
import VerticalDivider from "../../lib/VerticalDivider";
import classNames from "classnames";

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

  return (
    <div
      className={classNames("absolute right-1 top-1 bg-black-200 z-10 rounded-md", {
        "w-5/12 h-2/6": expand,
      })}
    >
      <Toolbar
        selectedDetails={selectedDetails}
        selected={selected}
        onBack={handleBackButton}
        view={view}
        expand={expand}
        toggleView={toggleView}
      />
      {expand && (
        <div className="overflow-y-auto h-full px-2 bg-black-200 rounded-md">
          <div className="relative ">
            <SelectedElements selected={selected} handleViewSelected={handleViewSelected} view={view} />
          </div>
        </div>
      )}
    </div>
  );

  //   if (!expand) {
  //     return (
  //       <div className="absolute top-0 right-0 z-10 bg-black-200 p-3  gap-y-2 ">
  //         <ExpandButton selected={selectedDetails} toggleView={toggleView} expand={expand} />
  //       </div>
  //     );
  //   }
  //   return (
  //     <div
  //       className="absolute top-0 right-0 z-10 bg-black-200 p-3 gap-y-2 w-2/5 overflow-y-auto"
  //       style={{ minHeight: "50%", height: "50%" }}
  //     >
  //       <div className=" z-10 flex items-center justify-end border-b border-black-500 gap-x-2 ">
  //         <Toolbar selectedDetails={selectedDetails} selected={selected} onBack={handleBackButton} view={view} />
  //         <VerticalDivider />
  //         <ExpandButton selected={selectedDetails} toggleView={toggleView} expand={expand} />
  //       </div>
  //       <div className="overflow-y-auto">
  //         <SelectedElements selected={selected} handleViewSelected={handleViewSelected} view={view} />
  //       </div>
  //     </div>
  //   );
};

const Toolbar = ({ selected, onBack, selectedDetails, view, toggleView, expand }) => {
  if (view === "singleItem" && selectedDetails.length > 1 && expand) {
    return (
      <div className="flex items-center justify-between px-4 py-2 border-b border-black-500">
        <button onClick={onBack} className="flex items-center font-medium text-lg">
          <span role="img" className="ri-arrow-left-s-line" />
          view all selected
        </button>
        <div className="flex items-center gap-x-2">
          <StreetView latitude={selected.lat} longitude={selected.lng} />
          <VerticalDivider />
          <ExpandButton selected={selectedDetails} toggleView={toggleView} expand={expand} />
        </div>
      </div>
    );
  }

  if (view === "singleItem" && expand) {
    return (
      <div className="flex items-center justify-between px-4 py-2 border-b border-black-500">
        <h2 className="font-medium text-lg">Element Details</h2>
        <div className="flex items-center gap-x-2">
          <StreetView latitude={selected.lat} longitude={selected.lng} />
          <VerticalDivider />
          <ExpandButton selected={selectedDetails} view={view} toggleView={toggleView} expand={expand} />
        </div>
      </div>
    );
  }
  return (
    <div className={classNames("flex items-center justify-between px-4 py-2", { "border-b border-black-500": expand })}>
      {expand && <h2 className="font-medium text-lg">Selected Elements</h2>}
      <ExpandButton selected={selectedDetails} toggleView={toggleView} expand={expand} />
    </div>
  );
};

const ExpandButton = ({ selected, toggleView, expand }) => {
  const label = `${!expand ? "open" : "close"} details panel`;
  return (
    <div className="relative flex justify-end">
      <button aria-labelledby={kebabCase(label)} className="relative" onClick={toggleView}>
        <i className="ri-information-line text-[color:var(--app-Colour)] !text-2xl" />
        {selected.length > 0 && !expand && (
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
        <div className="flex items-center">
          {" "}
          <GoogleMapIcon /> StreetView
        </div>
      </a>
      <div className="linkBorder" />
    </div>
  );
};

export default InfoPanel;
