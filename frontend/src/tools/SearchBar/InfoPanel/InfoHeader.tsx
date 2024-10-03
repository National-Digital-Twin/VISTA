import React, { useId } from "react";
import classNames from "classnames";
import styles from "./infopanel.module.css";

import GOOGLE_MAP_ICON from "./assets/google-map-icon.svg";

export interface InfoHeaderProps {
  /** Additional classes to add to the top-level element */
  className?: string;
  /** Children */
  children?: React.ReactNode;
}

export default function InfoHeader({ className, children }: InfoHeaderProps) {
  return (
    <div className={classNames(styles.infoHeader, className)}>{children}</div>
  );
}

export interface InfoTitleProps {
  /** Additional classes to add to the top-level element */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

export function InfoTitle({ children, className }: InfoHeaderProps) {
  return (
    <h2 className={classNames(styles.infoTitle, className)}>{children}</h2>
  );
}

export interface StreetViewProps {
  /** Additional classes to add to the top-level element */
  className?: string;
  /** Latitude, in decimal degrees */
  latitude: number;
  /** Longitude, in decimal degrees */
  longitude: number;
}

export function StreetView({
  latitude,
  longitude,
  className,
}: StreetViewProps) {
  const label = "Open street view";

  const params = {
    api: "1",
    map_action: "pano",
    viewpoint: `${latitude},${longitude}`,
  };
  const tooltipID = useId();

  if (!latitude && !longitude) {
    return null;
  }

  return (
    <div className={classNames(styles.streetViewContainer, className)}>
      <a
        href={`https://www.google.com/maps/@?${new URLSearchParams(params).toString()}`}
        target="_blank"
        rel="noreferrer"
        aria-labelledby={tooltipID}
        className={styles.streetViewLink}
      >
        <img
          src={GOOGLE_MAP_ICON}
          alt="Google Maps"
          className={styles.streetViewIcon}
        />
      </a>
      <div id={tooltipID} role="tooltip" className={styles.streetViewTooltip}>
        {label}
      </div>
    </div>
  );
}
