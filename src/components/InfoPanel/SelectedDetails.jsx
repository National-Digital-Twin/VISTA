import React, { useState, useContext } from "react";
import { ElementsContext } from "../../context";
import SelectedElements from "./SelectedElements";
import { ReactComponent as GoogleMapIcon } from "./assets/google-map-icon.svg";
import { useEffect } from "react";
import VerticalDivider from "../../lib/VerticalDivider";
import classNames from "classnames";
import InfoPanelHeader from "./InfoPanelHeader";

const viewType = {
  hasSingleItem: "singleItem",
  hasMultipleItems: "multipleItems",
};

const SelectedDetails = () => {
  const [expand, setExpand] = useState(false);
  const { selectedDetails } = useContext(ElementsContext);
  const [selected, setSelected] = useState();
  const [view, setView] = useState(viewType.hasMultipleItems);

  console.log("HERE>>>", selectedDetails);

  useEffect(() => {
    if (selectedDetails.length === 1) {
      setView(viewType.hasSingleItem);
      setSelected(selectedDetails[0]);
      return;
    }
    setView(viewType.hasMultipleItems);
    setSelected(selectedDetails);
  }, [selectedDetails]);

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
      className={classNames("absolute right-1 top-1 p-2 bg-black-200 z-10", {
        "w-5/12 h-72": expand,
      })}
    >
      <Toolbar
        selectedDetails={selectedDetails}
        selected={selected}
        onBack={handleBackButton}
        view={view}
        expand={expand}
        setExpand={setExpand}
      />
      {expand && (
        <div className="overflow-y-auto px-2 bg-black-200 h-56">
          <div className="relative ">
            <SelectedElements selected={selected} handleViewSelected={handleViewSelected} view={view} />
          </div>
        </div>
      )}
    </div>
  );
};

const Toolbar = ({ selected, onBack, selectedDetails, view, toggleView, expand, setExpand }) => {
  const viewAllButton = (
    <button onClick={onBack} className="flex items-center font-medium text-lg">
      <span role="img" className="ri-arrow-left-s-line" />
      view all selected
    </button>
  );

  if (view === "singleItem" && selectedDetails.length > 1 && expand) {
    return (
      <InfoPanelHeader selected={selected} expand={expand} setExpand={setExpand} leftComponent={viewAllButton}>
        <div className="flex justify-between">
          <StreetView latitude={selected.lat} longitude={selected.lng} />
        </div>

        <VerticalDivider />
      </InfoPanelHeader>
    );
  }

  if (view === "singleItem" && expand) {
    return (
      <InfoPanelHeader selected={selected} expand={expand} setExpand={setExpand} title="Element Details">
        <StreetView latitude={selected.lat} longitude={selected.lng} />
        <VerticalDivider />
      </InfoPanelHeader>
    );
  }
  return <InfoPanelHeader selected={selected} title="Element Details" expand={expand} setExpand={setExpand} />;
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
          <GoogleMapIcon /> Street View
        </div>
      </a>
      <div className="linkBorder" />
    </div>
  );
};

export default SelectedDetails;
