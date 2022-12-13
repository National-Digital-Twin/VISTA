import React, { useContext } from "react";

import { ElementsContext } from "context";
import { useLocalStorage } from "hooks";
import { FloatingPanel } from "lib";

import InfoBtn from "./InfoBtn";
import SelectedElements from "./SelectedElements/SelectedElements";

const InfoPanel = () => {
  const { selectedElements } = useContext(ElementsContext);
  const [showPanel, setShowPanel] = useLocalStorage("showInformationPanel", false);

  const handleTogglePanel = () => {
    setShowPanel((show) => !show);
  };

  return (
    <FloatingPanel
      id="information-panel"
      position="top-0 right-0 max-h-full flex flex-col"
      show={showPanel}
      collapsedComponent={<InfoBtn count={selectedElements.length} onToggle={handleTogglePanel} />}
      style={{
        width: showPanel ? "26rem" : "fit-content",
        maxWidth: "26rem",
        maxHeight: "calc(100% - 50px)",
      }}
    >
      <SelectedElements selectedElements={selectedElements} />
    </FloatingPanel>
  );
};

export default InfoPanel;
