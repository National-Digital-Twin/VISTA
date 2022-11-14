import { useLocalStorage } from "hooks";
import React, { useCallback, useContext, useState } from "react";
import { ElementsContext } from "../../context";
import { FloatingPanel } from "../../lib";
import InfoBtn from "./InfoBtn";
import InfoPanelHeader from "./InfoPanelHeader";
import SelectedElements from "./SelectedElements";

const InfoPanel = () => {
  const { assets, selectedElements, assetCriticalityColorScale, cxnCriticalityColorScale } =
    useContext(ElementsContext);
  const [showPanel, setShowPanel] = useLocalStorage("showInformationPanel", false);
  const [headerProps, setHeaderProps] = useState(undefined);

  const getDetails = (element) => element.generateDetails(assets, assetCriticalityColorScale, cxnCriticalityColorScale);

  const selectedCount = selectedElements.length;

  const handleTogglePanel = () => {
    setShowPanel((show) => !show);
  };

  const updateHeaderProps = useCallback((headerProps) => {
    setHeaderProps({ ...headerProps });
  }, []);

  return (
    <FloatingPanel
      id="information-panel"
      position="top-0 right-0 max-h-full flex flex-col"
      show={showPanel}
      collapsedComponent={<InfoBtn count={selectedCount} onToggle={handleTogglePanel} />}
      style={{ width: showPanel ? "30rem" : "fit-content", maxWidth: "30rem", maxHeight: "calc(100% - 50px)" }}
    >
      <InfoPanelHeader count={selectedCount} onToggle={handleTogglePanel} {...headerProps} />
      <SelectedElements
        headerProps={headerProps}
        getDetails={getDetails}
        selectedElements={selectedElements}
        onToggle={handleTogglePanel}
        updateHeaderProps={updateHeaderProps}
      />
    </FloatingPanel>
  );
};

export default InfoPanel;
