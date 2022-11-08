import React, { useCallback, useContext, useState } from "react";
import { ElementsContext } from "../../context";
import { FloatingPanel } from "../../lib";
import InfoBtn from "./InfoBtn";
import InfoPanelHeader from "./InfoPanelHeader";
import SelectedElements from "./SelectedElements";

const InfoPanel = () => {
  const { selectedDetails } = useContext(ElementsContext);
  const [showPanel, setShowPanel] = useState(false);
  const [headerProps, setHeaderProps] = useState(undefined);

  const selectedCount = selectedDetails.length;

  const handleTogglePanel = () => {
    setShowPanel((show) => !show);
  };

  const updateHeaderProps = useCallback((headerProps) => {
    setHeaderProps({ ...headerProps });
  }, []);

  return (
    <FloatingPanel
      position="top-0 right-0"
      show={showPanel}
      collapsedComponent={<InfoBtn count={selectedCount} onToggle={handleTogglePanel} />}
      style={{ maxWidth: "25rem" }}
    >
      <InfoPanelHeader count={selectedCount} onToggle={handleTogglePanel} {...headerProps} />
      <SelectedElements
        headerProps={headerProps}
        selectedDetails={selectedDetails}
        onToggle={handleTogglePanel}
        updateHeaderProps={updateHeaderProps}
      />
    </FloatingPanel>
  );
};

export default InfoPanel;
