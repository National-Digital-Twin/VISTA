import { isEmpty } from "lodash";
import React from "react";
import PropTypes from "prop-types";
import { useQuery } from "react-query";

import API from "../../api";
import AssessmentTypes from "./AssessmentTypes";

const Assessments = () => {
  const [fetch, setFetch] = React.useState(true);

  const { isLoading, isError, data } = useQuery("assessments", () => API.assessments.fetchAssessments(), {
    enabled: fetch,
  });

  React.useEffect(() => {
    if (fetch) {
      setFetch(false);
    }
  }, [fetch]);

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
