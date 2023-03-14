import React from "react";
import classNames from "classnames";

const AssetIcon = ({ backgroundColor, color, icon, iconLabel, className }) => (
  <div
    id="asset-icon"
    style={{
      backgroundColor: backgroundColor ?? "#A3A3A3",
      color: color ?? "#333",
    }}
    className={classNames("rounded-full flex justify-center items-center", {
      [className]: className,
    })}
  >
    {icon ? <span className={icon} /> : <span>{iconLabel}</span>}
  </div>
);

export default AssetIcon;
