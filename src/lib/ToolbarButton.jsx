import classNames from "classnames";
import { kebabCase } from "lodash";
import React from "react";

const ToolbarButton = ({
  icon,
  label,
  onClick,
  disabled,
  selected,
  secondaryMenu,
  showSecondaryMenu,
  className: listItemClassName,
  buttonClassName,
}) => (
  <li
    className={classNames(
      "grid first:justify-items-start justify-items-center gap-y-1 group relative",
      { [listItemClassName]: listItemClassName }
    )}
  >
    {showSecondaryMenu && secondaryMenu}
    <div
      className={classNames("w-full h-0.5 bg-whiteSmoke-500", {
        "opacity-0 group-hover:opacity-100": !showSecondaryMenu,
        "opacity-100": selected,
      })}
    />
    <button
      aria-labelledby={kebabCase(label)}
      className={classNames(
        "flex items-center justify-center rounded-md px-2 group-hover:bg-black-400 h-full",
        {
          [buttonClassName]: buttonClassName,
          "cursor-not-allowed": disabled,
          "bg-black-400": selected,
        }
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <i className={classNames("!text-base", icon)} />
    </button>
    <div
      id={kebabCase(label)}
      role="tooltip"
      className={classNames({ hideTooltip: showSecondaryMenu })}
    >
      {label}
    </div>
  </li>
);

export default ToolbarButton;
