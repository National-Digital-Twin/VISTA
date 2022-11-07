import classNames from "classnames";
import { kebabCase } from "lodash";
import React, { useCallback, useContext, useState } from "react";
import { ElementsContext } from "../../context";
import { FloatingPanel } from "../../lib";
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
    setHeaderProps({...headerProps});
  }, []);

  return (
    <FloatingPanel
      position="top-0 right-0"
      show={showPanel}
      collapsedComponent={<InfoBtn count={selectedCount} onToggle={handleTogglePanel} />}
      style={{ maxWidth: "25rem" }}
    >
      <InfoPanelHeader count={selectedCount} onToggle={handleTogglePanel} {...headerProps} />
      <SelectedElements headerProps={headerProps} onToggle={handleTogglePanel} updateHeaderProps={updateHeaderProps} />
    </FloatingPanel>
  );
};

export default InfoPanel;

const InfoBtn = ({ active, count, onToggle }) => {
  const label = `${!active ? "Close" : "Open"} information panel`;

  return (
    <div className="ml-auto">
      <button aria-labelledby={kebabCase(label)} className="relative" onClick={onToggle}>
        <i
          className={classNames("ri-information-line !text-xl", {
            "text-[color:var(--app-Colour)]": active,
          })}
        />
        <Badge count={count} />
      </button>
      <div id={kebabCase(label)} role="tooltip" className="right-0">
        {label}
      </div>
    </div>
  );
};

const Badge = ({ count }) => {
  if (count === 0) return null;
  // if (selectedDetails.length >= 1 && !expand) {
  return (
    <span
      id="selected-badge"
      className="absolute -top-2 -right-2 flex items-center justify-center w-4 h-4 rounded-full bg-whiteSmoke text-black-200 text-xs"
    >
      {count}
    </span>
  );
  // }
  // return null;
};
