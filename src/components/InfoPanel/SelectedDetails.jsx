import React, { useState, useContext } from "react";
import { ElementsContext } from "../../context";
import SelectedElements from "./SelectedElements";
import { useEffect } from "react";
import { InfoPanel, InfoPanelActions, InfoPanelHeader } from "./InfoPanelHeader";
import StreetView from "../../lib/StreetView";

const viewType = {
  hasSingleItem: "singleItem",
  hasMultipleItems: "multipleItems",
};

const SelectedDetails = () => {
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

  const handleViewSelected = (index) => {
    setView(viewType.hasSingleItem);
    setSelected(selectedDetails[index]);
  };

  const handleBackButton = () => {
    setView(viewType.hasMultipleItems);
    setSelected(selectedDetails);
  };

  const elementDetails = <h2 className="font-medium text-lg">Element Details</h2>;

  const viewAllBtn = (
    <button onClick={handleBackButton} className="flex items-center font-medium text-lg">
      <span role="img" className="ri-arrow-left-s-line" />
      view all selected
    </button>
  );

  const selectedLength = <h2 className="font-medium text-lg">{selectedDetails.length} Element Details</h2>;

  const masterView = {
    singleItem: (len) => {
      if (len === 1) {
        return elementDetails;
      }
      return viewAllBtn;
    },
    multipleItems: (len) => {
      if (len === 0) {
        return elementDetails;
      }
      return selectedLength;
    },
  };

  const topBar = (
    <InfoPanelHeader expand={expand} navigation={masterView[view](selectedDetails.length)}>
      <InfoPanelActions
        expand={expand}
        setExpand={setExpand}
        panelActions={[
          {
            icon: "ri-map-pin-line",
            label: "Open Street View",
            onClick: () => {
              console.log("clicked!");
            },
          },
        ]}
      />
    </InfoPanelHeader>
  );

  return (
    <InfoPanel expand={expand} topBar={topBar}>
      <div className="overflow-y-auto px-2 bg-black-200 h-56 rounded-md">
        <div className="relative ">
          <SelectedElements selected={selected} handleViewSelected={handleViewSelected} view={view} />
        </div>
      </div>
    </InfoPanel>
  );
};

export default SelectedDetails;
