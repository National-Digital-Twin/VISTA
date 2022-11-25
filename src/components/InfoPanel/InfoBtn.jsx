import { kebabCase } from "lodash";
import classNames from "classnames";
import React from "react";

const InfoBtn = ({ active, count, onToggle }) => {
  const label = `${active ? "Close" : "Open"} information panel`;

  return (
    <div className="relative">
      <button aria-labelledby={kebabCase(label)} onClick={onToggle} className="flex items-center justify-center">
        <i
          className={classNames("ri-information-line !text-xl", {
            "text-appColor": active,
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
export default InfoBtn;

const Badge = ({ count }) => {
  if (count === 0) return null;
  return (
    <span
      id="selected-badge"
      className="absolute -top-1.5 -right-0.5 text-appColor] text-xs"
    >
      {count}
    </span>
  );
};
