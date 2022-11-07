import React, { useContext } from "react";
import classNames from "classnames";
import { kebabCase } from "lodash";
import { ElementsContext } from "../../context";
import VerticalDivider from "../../lib/VerticalDivider";

export const InfoPanelHeader = ({ children, expand, setExpand, navigation }) => {
  return (
    <div className={classNames("flex items-center justify-between", { "border-b border-black-500 pb-1": expand })}>
      {expand && navigation}
      <div>{children}</div>
    </div>
  );
};

export const InfoPanelActions = ({ expand, panelActions, setExpand, streetViewButton }) => {
  return (
    <div className="flex items-center justify-end gap-x-2">
      {expand && (
        <>
          {streetViewButton}
          {panelActions?.map((item, index) => {
            return (
              <IconToolTip key={index} svg={item.svg} icon={item.icon} label={item.label} onClick={item.onClick} />
            );
          })}
          <VerticalDivider />
        </>
      )}
      <ExpandButton expand={expand} setExpand={setExpand} />
    </div>
  );
};

export const InfoPanel = ({ expand, topBar, children }) => {
  return (
    <div
      className={classNames("absolute right-1 top-1 p-2 bg-black-200 z-10 rounded-md", {
        "w-5/12 h-72": expand,
      })}
    >
      {topBar}
      {expand && children}
    </div>
  );
};

const ExpandButton = ({ expand, setExpand }) => {
  const toggleView = () => {
    setExpand(!expand);
  };

  const label = `${!expand ? "open" : "close"} details panel`;

  return (
    <div className="flex justify-end pt-1">
      <button aria-labelledby={kebabCase(label)} className="relative" onClick={toggleView}>
        <i className={classNames("ri-information-line !text-2xl", { "text-[color:var(--app-Colour)]": !expand })} />
        <SelectedBadge expand={expand} />
      </button>
      <div id={kebabCase(label)} role="tooltip" className="right-0">
        {label}
      </div>
    </div>
  );
};

const SelectedBadge = ({ expand }) => {
  const { selectedDetails } = useContext(ElementsContext);

  if (selectedDetails.length >= 1 && !expand) {
    return (
      <span
        id="selected-badge"
        className="absolute -top-0.5 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-whiteSmoke text-black-200 text-sm"
      >
        {selectedDetails.length}
      </span>
    );
  }
  return null;
};

const IconToolTip = ({ label, onClick, icon, svg }) => {
  return (
    <div className="flex justify-end pb-1">
      <button aria-labelledby={kebabCase(label)} className="relative" onClick={onClick}>
        {svg ? svg : <i className={`${icon} !text-2xl`} />}
      </button>
      <div id={kebabCase(label)} role="tooltip" className="right-0">
        {label}
      </div>
    </div>
  );
};
