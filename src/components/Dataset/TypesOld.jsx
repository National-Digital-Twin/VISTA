import { Spinner } from '@telicent-io/ds';
import React from "react";
import useFetch from "use-http";

import { IsEmpty } from "utils";

const Types = ({ selected, onChange }) => {
  const { data, loading, error } = useFetch('/assessments', {}, []);

  if (loading) return <Loader label="Fetching assessments" />;

  if (error) {
    return (
      <p id="errorMsg" className='text-fluorescentRed'>
        Unable to retrieve categories. Please try again, if the problem persists contact admin.
      </p>
    );
  }

  const assessments = data
    .filter((assessment) => assessment.assCount > 0)
    .map((assessment) => ({
      label: `${assessment.name} [${assessment.assCount}]`,
      value: assessment.uri,
    }));

  if (IsEmpty(assessments)) return <p className="text-center">Assessments not found</p>;

  return (
    <ul id="dataset" className="flex flex-col gap-y-2">
      {assessments.map(({ label, value }) => (
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
export default Types;

const Loader = ({ label }) => (
  <div className="flex flex-col items-center gap-y-2">
    <Spinner size="sm" />
    {label && <p id='loader' className="lowercase">{label}</p>}
  </div>
);

const CheckListItem = ({ value, label, onChange, selected }) => (
  <li className="inline-flex gap-x-1 text-xs">
    <input
      type="checkbox"
      value={value}
      id={value}
      defaultChecked={selected}
      onChange={onChange}
      className="w-3.5"
    />
    <label htmlFor={value} className="uppercase">
      {label}
    </label>
  </li>
);
