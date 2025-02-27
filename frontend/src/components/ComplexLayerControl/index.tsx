import type { ReactNode } from "react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { useBoolean } from "usehooks-ts";
import styles from "./style.module.css";

export interface ComplexLayerControlProps {
  /** Icon for the layer */
  readonly icon?: IconProp;
  /** Title of the layer */
  readonly title: string;
  /** Children */
  readonly children: ReactNode;
  /** Automatic show and hide for search */
  readonly autoShowHide?: boolean;
}

export default function ComplexLayerControl({
  icon,
  title,
  children,
  autoShowHide = false,
}: ComplexLayerControlProps) {
  const { value: expanded, toggle } = useBoolean(false);

  return (
    <div
      className={styles.complexLayerContainer}
      data-expanded={expanded}
      data-auto-show-hide={autoShowHide}
    >
      <div
        onClick={toggle}
        className={styles.complexLayer}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            toggle();
          }
        }}
      >
        {icon && <FontAwesomeIcon icon={icon} className={styles.icon} />}
        <FontAwesomeIcon
          icon={expanded ? faChevronDown : faChevronRight}
          className={styles.toggle}
        />
        <h3 className={styles.body}>{title}</h3>
      </div>
      <div aria-expanded={expanded} className={styles.content}>
        {children}
      </div>
      <hr className={styles.divider} />
    </div>
  );
}
