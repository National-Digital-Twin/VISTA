import React, { useContext } from "react";

import { ElementsContext } from "context";
import { useLocalStorage } from "hooks";
import { FloatingPanel } from "lib";

import InfoHeader from "./InfoHeader";
import SelectedElements from "./SelectedElements/SelectedElements";

const InfoPanel = () => {
  const { selectedElements } = useContext(ElementsContext);
  const [showContent, setShowContent] = useLocalStorage("showInformationContent", false);

  const handleTogglePanel = () => {
    setShowContent((show) => !show);
  };

  return (
    <FloatingPanel
      id="information-panel"
      position="top-0 right-0"
      className="flex flex-col max-h-full"
      style={{
        width: showContent ? "26rem" : "fit-content",
        maxWidth: "26rem",
        maxHeight: "calc(100% - 50px)",
      }}
    >
      <InfoPanelContent
        show={showContent}
        totalSelected={selectedElements.length}
        onToggle={handleTogglePanel}
      >
        <SelectedElements selectedElements={selectedElements} onTogglePanel={handleTogglePanel} />
      </InfoPanelContent>
    </FloatingPanel>
  );
};

export default InfoPanel;

const InfoPanelContent = ({ show, totalSelected, onToggle, children }) => {
  if (show) return children;
  return <InfoHeader isExpanded={false} count={totalSelected} onToggle={onToggle} />;
};
