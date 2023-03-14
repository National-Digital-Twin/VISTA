import React from "react";
import { kebabCase } from "lodash";
import classNames from "classnames";
import PropTypes from "prop-types";

import { VerticalDivider } from "lib";
import { ReactComponent as GoogleMapIcon } from "./assets/google-map-icon.svg";

const InfoHeader = ({ isExpanded, count, onToggle, className: wrapperClassName, children }) => (
  <div
    className={classNames("sticky top-0 bg-black-200 z-20", {
      "flex items-center gap-x-2 border-b border-black-500 pb-1": isExpanded,
      [wrapperClassName]: wrapperClassName,
    })}
  >
    {isExpanded && children}
    <div className="flex items-center gap-x-2">
      {isExpanded && <VerticalDivider height="h-5" />}
      <InfoBtn active={isExpanded} count={count} onToggle={onToggle} />
    </div>
  </div>
);

export default InfoHeader;
InfoHeader.defaultProps = {
  classNames: undefined,
  children: null,
};
InfoHeader.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
  count: PropTypes.number.isRequired,
  onToggle: PropTypes.func.isRequired,
  classNames: PropTypes.string,
  children: PropTypes.node,
};

const InfoBtn = ({ active, count, onToggle }) => {
  const label = `${active ? "Close" : "Open"} information panel`;

  return (
    <div className="relative">
      <button
        aria-labelledby={kebabCase(label)}
        onClick={onToggle}
        className={classNames("flex items-center justify-center", {
          "text-appColor": active,
        })}
      >
        <i className="ri-information-line !text-xl" />
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
  return (
    <span id="selected-badge" className="absolute -top-1.5 -right-0.5 text-xs">
      {count}
    </span>
  );
};

export const InfoTitle = ({ children }) => <h2 className="font-medium">{children}</h2>;

export const StreetView = ({ latitude, longitude, className: wrapperClassName }) => {
  const label = "Open street view";
  if (!latitude && !longitude) return null;

  const params = {
    api: 1,
    map_action: "pano",
    viewpoint: `${latitude},${longitude}`,
  };

  return (
    <div className={classNames("relative w-fit", { [wrapperClassName]: wrapperClassName })}>
      <a
        href={`https://www.google.com/maps/@?${new URLSearchParams(params).toString()}`}
        target="_blank"
        rel="noreferrer"
        aria-labelledby={kebabCase(label)}
      >
        <GoogleMapIcon />
      </a>
      <div id={kebabCase(label)} role="tooltip" className="right-0">
        {label}
      </div>
    </div>
  );
};
