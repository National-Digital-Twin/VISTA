import classNames from "classnames";

import styles from "./style.module.css";
import featureFlags from "@/config/feature-flags";

export interface PageHeaderProps {
  /** Primary name of the application, as it appears in the header */
  appName: string;
  /** Additional classes to add to the top-level element */
  className?: string;
}

/** Overall header of the application */
export default function PageHeader({ appName, className }: PageHeaderProps) {
  const srOnly = featureFlags.pageHeader ? null : "sr-only";

  return (
    <header className={classNames(styles.pageHeader, className, srOnly)}>
      <h1 className={styles.title}>
        <a href="/" className={styles.noLinkStyle}>
          {appName}
        </a>
      </h1>
    </header>
  );
}
