import classNames from "classnames";
import React from "react";
import ReactSwitch from "react-switch";

const TelicentSwitch = ({ label, checked, onChange, className: wrapperClassName }) => (
  <label
    className={classNames("flex items-center gap-x-3 text-sm w-fit", {
      [wrapperClassName]: wrapperClassName,
    })}
  >
    {label}
    <ReactSwitch
      onChange={onChange}
      checked={checked}
      offColor="#636363"
      onColor="#f5f5f5"
      onHandleColor="#141414"
      handleDiameter={10}
      height={16}
      width={32}
      uncheckedIcon={false}
      checkedIcon={false}
    />
  </label>
);

export default TelicentSwitch;
