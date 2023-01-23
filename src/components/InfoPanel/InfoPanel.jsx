import React, { useContext } from "react";
import classNames from "classnames";

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
      position="top-0 right-0"
      className="flex flex-col max-h-full"
      style={{
        width: showPanel ? "26rem" : "fit-content",
        maxWidth: "26rem",
        maxHeight: "calc(100% - 50px)",
      }}
    >
      <InfoBtn
        count={selectedElements.length}
        onToggle={handleTogglePanel}
        className={classNames({ hidden: showPanel, block: !showPanel })}
        ariaHidden={showPanel}
      />
      <div className={classNames({ hidden: !showPanel, block: showPanel })} aria-hidden={showPanel}>
        <SelectedElements selectedElements={selectedElements} onTogglePanel={handleTogglePanel} />
      </div>
    </FloatingPanel>
  );
};

export default InfoPanel;
