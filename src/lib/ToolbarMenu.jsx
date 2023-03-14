import classNames from "classnames";
import React, { useRef } from "react";

import { useOutsideAlerter } from "hooks";
import TelicentSwitch from "./TelicentSwitch";

const ToolbarMenu = ({ id, menuItems, onClose }) => {
  const containerRef = useRef();
  useOutsideAlerter({ ref: containerRef, fn: onClose });

  const generateMenuItems = ({ id, name, selected, type, onItemClick, children }) => {
    const typeProps = { name, selected, onItemClick, children };
    const menuItemTypes = {
      button: <MenuBtn {...typeProps} />,
      toggleSwitch: <MenuToggle {...typeProps} />,
    };

    return (
      <li key={id || name} className="w-full">
        {menuItemTypes[type]}
      </li>
    );
  };

  return (
    <ul
      ref={containerRef}
      id={id}
      className="floating-menu bottom-10 px-2 py-1 flex flex-col items-center gap-y-2 max-h-40 overflow-y-auto overscroll-y-contain scroll-smooth"
      style={{ maxWidth: "10rem" }}
    >
      {menuItems.map(generateMenuItems)}
    </ul>
  );
};
export default ToolbarMenu;

const MenuBtn = ({ name, selected, onItemClick, children }) => (
  <button
    className={classNames("hover:bg-black-400 px-2 rounded-md w-full h-full whitespace-nowrap", {
      "bg-black-500": selected,
    })}
    onClick={onItemClick}
  >
    {children || name}
  </button>
);

const MenuToggle = ({ name, selected, onItemClick }) => (
  <TelicentSwitch label={name} checked={selected} onChange={onItemClick} />
);
