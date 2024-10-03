import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleRight, faAngleLeft } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames";
import InfoPanel from "./InfoPanel/InfoPanel";
import styles from "./style.module.css";
import { fetchAssessments } from "@/api/assessments";

export default function SideBar() {
  const { isLoading: isLoadingAssessments, isError: isErrorAssessments } =
    useQuery({
      queryKey: ["assessments"],
      queryFn: () => fetchAssessments(),
    });

  const [sidebarIsVisible, setSidebarIsVisible] = useState(false);
  const toggleSidebar = useCallback(() => {
    setSidebarIsVisible((isVisible) => !isVisible);
  }, []);

  if (isLoadingAssessments) {
    return null;
  }
  if (isErrorAssessments) {
    return null;
  }

  return (
    <div
      className={classNames(
        styles.sidebar,
        sidebarIsVisible ? styles.sidebarVisible : styles.sidebarHidden,
      )}
      data-paralog-sidebar={sidebarIsVisible}
    >
      <button
        className={styles.sidebarToggleButton}
        onClick={toggleSidebar}
        aria-label={sidebarIsVisible ? "Close sidebar" : "Open sidebar"}
        aria-expanded={sidebarIsVisible}
      >
        <FontAwesomeIcon
          icon={sidebarIsVisible ? faAngleLeft : faAngleRight}
          className="h-6 w-6"
          aria-hidden="true"
        />
      </button>

      {sidebarIsVisible && (
        <>
          <h2 className={styles.sidebarTitle}>Asset Details</h2>
          <div className={styles.sidebarContent}>
            <InfoPanel />
          </div>
        </>
      )}
    </div>
  );
}
