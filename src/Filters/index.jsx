import React, { useState, useEffect, useCallback } from "react";
import useFetch from "use-http";
import config from "../config/app-config";

const Filters = ({ selected, setSelected }) => {
  const [filters, setFilters] = useState([]);

  const { get, error, loading, response } = useFetch(config.api.url);
  const onChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelected((prevSelected) =>
      prevSelected.some((filter) => filter === value)
        ? prevSelected.filter((filter) => filter !== value)
        : [...prevSelected, value]
    );
  };
  const getFilters = useCallback(async () => {
    const assessments = await get("/assessments");
    let filters = [];
    if (response.ok) {
      filters = assessments
        .filter((assessment) => assessment.assCount > 0)
        .map((assessment) => ({
          label: `${assessment.name} [${assessment.assCount}]`,
          value: assessment.uri,
        }));
    }
    setFilters(filters);
  }, [setFilters, get, response]);

  useEffect(() => {
    getFilters();
  }, [getFilters]);

  return (
    <div style={{ width: "100%" }}>
      {loading && <p>Loading</p>}
      {error && (
        <div>
          <p id="errorMsg" style={{ color: "rgb(239, 68, 68)" }}>
            {error}
          </p>
        </div>
      )}
      {!error && response.ok && (
        <div style={{ overflowX: "auto" }}>
          {filters.map((filter) => (
            <CheckListItem
              key={filter.value}
              value={filter.value}
              label={filter.label}
              selected={selected.includes(filter.value)}
              onChange={onChange}
            />
          ))}
        </div>
      )}
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
    <input
      type="checkbox"
      value={value}
      id={value}
      defaultChecked={selected}
      onChange={onChange}
    />
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

export default Filters;
