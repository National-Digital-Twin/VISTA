import React, { useContext, useEffect, useState } from "react";
import useFetch from "use-http";
import config from "../../config/app-config";
import { ElementsContext } from "../../context";
import { IsEmpty } from "../../utils";
import { createData } from "../DataFigures/utils";

const Categories = () => {
  const { get, response, error, loading } = useFetch(config.api.url);
  const { filterSelectedElements, reset, updateAssets, updateConnections } = useContext(ElementsContext);

  const [assessments, setAssessments] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const getAssessments = async () => {
      const assessments = await get("/assessments");
      if (response.ok) {
        setAssessments(assessments);
        return;
      }
    };

    getAssessments();
  }, [get, response]);

  useEffect(() => {
    if (IsEmpty(selected)) { 
      reset();
      return;
    }

    const paramsArray = selected.map((item) => ["assessments", item]);
    const params = new URLSearchParams(paramsArray).toString();

    const getAssessments = async () => {
      const assetsMetadata = await get(`assessments/assets?${params}`);
      const connectionsMetadata = await get(`assessments/connections?${params}`);

      if (response.ok) {
        const { assets, connections } = await createData(assetsMetadata, connectionsMetadata, get);
        updateAssets(assets);
        updateConnections(connections);
        filterSelectedElements(assets, connections);
        return;
      }
    };

    getAssessments();
  }, [get, response, selected, filterSelectedElements, reset, updateAssets, updateConnections]);

  // if (loading) return <p>Loading</p>;

  if (error)
    return (
      <p id="errorMsg" style={{ color: "rgb(239, 68, 68)", textAlign: "center" }}>
        Unable to retrieve categories. Please try again, if the problem persists contact admin.
      </p>
    );

  const categories = assessments
    .filter((assessment) => assessment.assCount > 0)
    .map((assessment) => ({
      label: `${assessment.name} [${assessment.assCount}]`,
      value: assessment.uri,
    }));

  if (IsEmpty(categories))
    return (
      <p style={{ textAlign: "center" }}>
        Categories not found. Please contact admin to resolve issue.
      </p>
    );

  const onChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelected(
      selected.some((filter) => filter === value)
        ? selected.filter((filter) => filter !== value)
        : [...selected, value]
    );
  };

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      {categories.map((filter) => (
        <CheckListItem
          key={filter.value}
          value={filter.value}
          label={filter.label}
          selected={selected.includes(filter.value)}
          onChange={onChange}
        />
      ))}
    </div>
  );
};

const CheckListItem = ({ value, label, onChange, selected }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      marginRight: "0.5rem",
      position: "relative",
      fontSize: "0.8em",
      textTransform: "uppercase",
    }}
  >
    <input type="checkbox" value={value} id={value} defaultChecked={selected} onChange={onChange} />
    <label
      htmlFor={value}
      style={{
        display: "inline-block",
        marginBottom: "0",
        marginLeft: "4px",
        letterSpacing: "0.5px",
      }}
    >
      {label}
    </label>
  </div>
);

export default Categories;
