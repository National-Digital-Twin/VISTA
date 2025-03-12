import { useQuery } from "@tanstack/react-query";
import classNames from "classnames";
import { forwardRef } from "react";
import AssetTypes from "./Assets/AssetTypes";
import styles from "./style.module.css";
import { fetchAssessments } from "@/api/assessments";

export interface SideDropdownProps {
  /** Search query being searched for */
  searchQuery: string;
  /** Additional classes to add to the top-level element */
  className?: string;
}

export default forwardRef<HTMLDivElement, SideDropdownProps>(
  function SideDropdown({ searchQuery, className }: SideDropdownProps, ref) {
    const {
      isError: isErrorAssessments,
      data: assessmentsData,
      isLoading,
    } = useQuery({
      queryKey: ["assessments"],
      queryFn: fetchAssessments,
    });

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (isErrorAssessments) {
      return <div>Error loading assessments</div>;
    }

    return (
      <div className={classNames(styles.sideDropdown, className)} ref={ref}>
        {assessmentsData.map((assessment) => (
          <AssetTypes
            key={assessment.uri}
            assessment={assessment.uri}
            searchQuery={searchQuery}
          />
        ))}
      </div>
    );
  },
);
