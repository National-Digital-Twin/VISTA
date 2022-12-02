import React from "react";
import useFetch from "use-http";
import AssessmentTypes from "./AssessmentTypes";

const Assessments = ({ selectedTypes, setSelectedTypes }) => {
  const { data, error, loading } = useFetch("/assessments", {}, []);

  if (loading) return <p>loading</p>;
  if (error) return <p>{error.message}</p>;

  return (
    <AssessmentTypes
      assessment={data[0].uri}
      selectedTypes={selectedTypes}
      setSelectedTypes={setSelectedTypes}
    />
  );
};

export default Assessments;
