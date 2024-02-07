import { isEmpty } from "lodash";
import React from "react";
import PropTypes from "prop-types";
import { useQuery } from "@tanstack/react-query";

import { fetchAssessments } from "api/assessments";
import AssessmentTypes from "./AssessmentTypes";

const Assessments = () => {
  const { isLoading, isError, data } = useQuery({
    queryKey: ["assessments"],
    queryFn: fetchAssessments,
  });

  if (isLoading) return <p>Fetching assessments</p>;
  if (isError)
    return (
      <p>
        An error occured while retrieving assessments. Please try again. If problem persists contact
        admin
      </p>
    );
  if (isEmpty(data)) return <p>Assessments not found</p>;

  return <AssessmentTypes assessment={data[0].uri} />;
};

export default Assessments;

Assessments.defaultProps = {
  selectedTypes: [],
  setSelectedTypes: () => {},
};

Assessments.propTypes = {
  selectedTypes: PropTypes.arrayOf(PropTypes.string),
  setSelectedTypes: PropTypes.func,
};
