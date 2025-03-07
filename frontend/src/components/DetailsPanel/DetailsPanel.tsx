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
  const [height, setHeight] = useState(300);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resizeHandle = resizeRef.current;
    if (!resizeHandle) {
      return;
    }

    let startY: number;
    let startHeight: number;

    const onMouseMove = (e: MouseEvent) => {
      const deltaY = startY - e.clientY;
      const newHeight = Math.max(
        100,
        Math.min(startHeight + deltaY, window.innerHeight - 100),
      );
      setHeight(newHeight);
    };

    const onMouseUp = () => {
      document.body.classList.remove(styles.noSelect);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    const onMouseDown = (e: MouseEvent) => {
      document.body.classList.add(styles.noSelect);
      startY = e.clientY;
      startHeight = height;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    resizeHandle.addEventListener("mousedown", onMouseDown);

    return () => {
      resizeHandle.removeEventListener("mousedown", onMouseDown);
    };
  }, [height]);

  return (
    <div
      ref={panelRef}
      className={classNames(styles.detailsPanel)}
      data-expanded={isOpen}
      style={{ height: `${height}px`, maxHeight: "22vh" }}
    >
      <div ref={resizeRef} className={styles.resizeHandle} />
      {onClose && (
        <button onClick={onClose} className={styles.toggleButton}>
          <FontAwesomeIcon icon={faChevronDown} size="2x" />
        </button>
      )}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
