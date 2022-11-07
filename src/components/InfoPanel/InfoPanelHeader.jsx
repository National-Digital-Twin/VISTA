import { kebabCase } from "lodash";
import React from "react";

import InfoBtn from "./InfoBtn";
// move assets folder
import { ReactComponent as GoogleMapIcon } from "../../lib/assets/google-map-icon.svg";
import { VerticalDivider } from "../../lib";

const InfoPanelHeader = ({ count, panelActions, title, viewAll, onToggle, onViewAll }) => {
  console.log({ title, onViewAll });

  return (
    <div className="flex items-center gap-x-2 border-b border-black-500 pb-1">
      {title && <h2 className="font-medium">{title}</h2>}
      {viewAll && (
        <button onClick={onViewAll} className="flex items-center">
          <span role="img" className="ri-arrow-left-s-line" />
          {viewAll}
        </button>
      )}
      <div className="flex items-center gap-x-1 ml-auto">
        <PanelActions actions={panelActions} />
        <VerticalDivider />
        <InfoBtn active count={count} onToggle={onToggle} />
      </div>
    </div>
  );
};
export default InfoPanelHeader;

const PanelActions = ({ actions }) => {
  if (!actions && !Array.isArray(actions)) return null;

  return actions.map(({ href, label, icon, type, onClick }) => {
    const actionTypes = {
      link: (
        <a href={href} target="_blank" rel="noreferrer" className="link cursor-pointer" aria-labelledby={kebabCase(label)}>
          <GoogleMapIcon />
        </a>
      ),
      button: (
        <button aria-labelledby={kebabCase(label)} onClick={onClick}>
          <i className={`${icon} !text-2xl`} />
        </button>
      ),
    };

    return (
      <ul key={label}>
        <li className="relative">
          {actionTypes[type]}
          <div id={kebabCase(label)} role="tooltip" className="right-0">
            {label}
          </div>
        </li>
      </ul>
    );
  });
};
