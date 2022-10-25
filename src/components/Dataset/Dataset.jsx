import React, { useContext, useEffect, useState } from "react";
import useFetch from "use-http";

import PropTypes from "prop-types";

import config from "../../config/app-config";
import { ElementsContext } from "../../context";
import { IsEmpty } from "../../utils";
import { createData } from "./utils";

const Categories = () => {
  const { get, response, error } = useFetch(config.api.url);
  const { setData } = useContext(ElementsContext);

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
      setData({
        assetCriticalityColorScale: {},
        assets: [],
        connections: [],
        cxnCriticalityColorScale: {},
        maxAssetCriticality: 0,
        maxAssetTotalCxns: 0,
        totalCxnsColorScale: {},
      });
      return;
    }

    const paramsArray = selected.map((item) => ["assessments", item]);
    const params = new URLSearchParams(paramsArray).toString();

    const getAssessments = async () => {
      const assets = await get(`assessments/assets?${params}`);
      const connections = await get(`assessments/connections?${params}`);
      const data = await createData(assets, connections, get);
      setData(data);
    };
    getAssessments();
  }, [get, selected, setData]);

  // if (loading) return <p>Loading</p>;

  if (error)
    return (
      <p id="errorMsg" style={{ color: "rgb(239, 68, 68)", textAlign: "center" }}>
        Unable to retrieve categories. Please try again, if the problem persists contact admin.
      </p>
    );

  const data = assessments
    .filter((assessment) => assessment.assCount > 0)
    .map((assessment) => ({
      label: `${assessment.name} [${assessment.assCount}]`,
      value: assessment.uri,
    }));

  if (IsEmpty(data))
    return (
      <p style={{ textAlign: "center" }}>
        data not found. Please contact admin to resolve issue.
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
    <ul id="dataset" className="flex flex-col gap-y-2">
      {data.map(({ label, value }) => (
        <CheckListItem
          key={value}
          value={value}
          label={label}
          selected={selected.includes(value)}
          onChange={onChange}
        />
      ))}
    </ul>
  );
};
export default Categories;
Categories.defaultProps = {
  showGrid: false,
  toggleView: () => {}
}
Categories.propTypes = {
  showGrid: PropTypes.bool,
  toggleView: PropTypes.func
}

const CheckListItem = ({ value, label, onChange, selected }) => (
  <li
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
  </li>
);


