import type React from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

import { useRef, useId, useState, useEffect, useCallback } from "react";
import classNames from "classnames";

import styles from "./style.module.css";

export interface ToolbarDropdownProps {
  /** Dropdown icon */
  icon?: IconDefinition;
  /** Title */
  title: string;
  /** Children */
  children:
    | React.ReactNode
    | ((props: { toggle: () => void }) => React.ReactNode);
  /** Is this a large menu? */
  large?: boolean;
}

export default function ToolbarDropdown({
  icon,
  title,
  children,
  large = false,
}: ToolbarDropdownProps) {
  const wrapperRef = useRef<HTMLDivElement>();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = useCallback(() => {
    setIsOpen((state) => !state);
  }, []);

  const handleClickOutside = useCallback((event) => {
    if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  }, []);

  const menuId = useId();

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div
      className={styles.toolbarDropdown}
      ref={wrapperRef}
      data-dropdown-open={isOpen}
    >
      <ToolbarDropdownButton
        id={menuId}
        onClick={toggleDropdown}
        icon={icon}
        title={title}
      />

      <div
        className={classNames(styles.dropdown, "menu", large && "menu-lg")}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby={menuId}
      >
        {typeof children === "function"
          ? children({ toggle: toggleDropdown })
          : children}
      </div>
    </div>
  );
}

interface ToolbarDropdownButtonProps {
  id: string;
  onClick: () => void;
  icon?: IconDefinition;
  title: string;
}

function ToolbarDropdownButton({
  id,
  onClick,
  icon,
  title,
}: ToolbarDropdownButtonProps) {
  const buttonClasses = classNames(styles.toolbarDropdownButton, "btn");

  return (
    <button type="button" id={id} className={buttonClasses} onClick={onClick}>
      {icon && (
        <FontAwesomeIcon
          icon={icon}
          className={styles.toolbarDropdownButtonIcon}
        />
      )}
      {title}
      <FontAwesomeIcon
        icon={faChevronDown}
        className={styles.toolbarDropdownButtonDisclosureTriangle}
      />
    </button>
  );
}
