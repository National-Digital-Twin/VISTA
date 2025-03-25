import React, { useState, useEffect, useRef } from "react";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import styles from "./style.module.css";

interface DetailsPanelProps {
  readonly children: React.ReactNode;
  readonly onClose?: () => void;
  readonly isOpen: boolean;
}

export default function DetailsPanel({
  children,
  onClose,
  isOpen,
}: DetailsPanelProps) {
  return (
    <div
      className={classNames(styles.detailsPanel)}
      data-expanded={isOpen}
      style={{ height: `350px`, maxHeight: "22vh" }}
    >
      {onClose && (
        <button onClick={onClose} className={styles.toggleButton}>
          <FontAwesomeIcon icon={faChevronDown} size="2x" />
        </button>
      )}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
