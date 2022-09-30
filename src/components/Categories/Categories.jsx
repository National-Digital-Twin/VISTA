import React from "react";
import useFetch from "use-http";
import config from "../../config/app-config";
import { IsEmpty } from "../../utils";

const Categories = ({ selected, setSelected }) => {
  const { data = [], error, loading } = useFetch(`${config.api.url}/assessments`, {}, []);

  if (loading) return <p>Loading</p>;

  if (error)
    return (
      <p id="errorMsg" style={{ color: "rgb(239, 68, 68)", textAlign: "center" }}>
        Unable to retrieve categories. Please try again, if the problem persists contact admin.
      </p>
    );

  const categories = data
    .filter((assessment) => assessment.assCount > 0)
    .map((assessment) => ({
      label: `${assessment.name} [${assessment.assCount}]`,
      value: assessment.uri,
    }));

  if (IsEmpty(categories)) return <p style={{ textAlign: "center" }}>Categories not found. Please contact admin to resolve issue.</p>;

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
