import { kebabCase } from "lodash";
import classNames from "classnames";
import React from "react";

const InfoBtn = ({ active, count, onToggle, className: wrapperClassName }) => {
  const label = `${!active ? "Close" : "Open"} information panel`;

  return (
    <div className={wrapperClassName}>
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
export default InfoBtn;

const Badge = ({ count }) => {
  if (count === 0) return null;
  return (
    <span
      id="selected-badge"
      className="absolute -top-2 -right-2 flex items-center justify-center w-4 h-4 rounded-full bg-whiteSmoke text-black-200 text-xs"
    >
      {count}
    </span>
  );
};
