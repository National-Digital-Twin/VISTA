import { isEmpty } from "lodash";
import React from "react";
import useFetch from "use-http";
import PropTypes from "prop-types";

import { ASSESSMENTS_ENDPOINT } from "constants/endpoints";
import AssessmentTypes from "./AssessmentTypes";

const Assessments = () => {
  const { data, error, loading } = useFetch(ASSESSMENTS_ENDPOINT, {}, []);

  if (loading) return <p>Fetching assessments</p>;
  if (error)
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
