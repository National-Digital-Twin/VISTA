import React, { useState, useContext } from "react";
import { ElementsContext } from "../../../context";
import { useEffect } from "react";
import { InfoPanel, InfoPanelActions, InfoPanelHeader } from "../InfoPanel";
import StreetView from "../../../lib/StreetView";
import RenderElementDetails from "./RenderElementDetails";

const viewType = {
  hasSingleItem: "singleItem",
  hasMultipleItems: "multipleItems",
};

const SelectedElements = () => {
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

  const viewAllBtn = (
    <button onClick={handleBackButton} className="flex items-center font-medium text-lg">
      <span role="img" className="ri-arrow-left-s-line" />
      view all selected
    </button>
  );

  const title = () => {
    if (selectedDetails.length > 1) {
      return <h2 className="font-medium text-lg">{selectedDetails.length} Selected Elements</h2>;
    }
    return <h2 className="font-medium text-lg">Element Details</h2>;
  };

  const masterView = {
    singleItem: (len) => {
      if (len === 1) {
        return title();
      }
      return viewAllBtn;
    },
    multipleItems: (len) => {
      if (len === 0) {
        return title();
      }
      return title();
    },
  };
  const topBar = (
    <InfoPanelHeader expand={expand} navigation={masterView[view](selectedDetails.length)}>
      <InfoPanelActions expand={expand} setExpand={setExpand} streetViewButton={<StreetView selected={selected} />} />
    </InfoPanelHeader>
  );

  return (
    <InfoPanel expand={expand} topBar={topBar}>
      <div className="overflow-y-auto px-2 bg-black-200 h-56 rounded-md">
        <div className="relative ">
          <RenderElementDetails selected={selected} handleViewSelected={handleViewSelected} view={view} />
        </div>
      </div>
    </InfoPanel>
  );
};

export default SelectedElements;
