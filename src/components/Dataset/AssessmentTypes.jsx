import { capitalize, lowerCase } from "lodash";
import classNames from "classnames";
import React, { useEffect, useState } from "react";
import useFetch from "use-http";

import { getURIFragment } from "utils";
import GroupedTypes from "./GroupedTypes";

const AssessmentTypes = ({ assessment, selectedTypes, setSelectedTypes }) => {
  const { abort, get, error, response } = useFetch();

  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);

  useEffect(() => {
    if (!assessment) return;

    const getTypes = async () => {
      const assetTypesParams = { assessment };
      const types = await get(
        `/assessments/asset-types?${new URLSearchParams(assetTypesParams).toString()}`
      );
      return response.ok && types;
    };

    const generateOntologyGroups = async () => {
      setLoading(true);
      const types = await getTypes();

      const typesWithSuperClasses = await Promise.all(
        types.map(async (type) => {
          const { uri } = type;
          const classUri = { classUri: uri };
          const superClasses = await get(
            `ontology/class?${new URLSearchParams(classUri).toString()}`
          );

          if (response.ok) {
            const superClass = superClasses[uri]?.superClass[0] ?? "other";
            return { ...type, superClass };
          }
        })
      ).catch((error) => {
        console.log(error);
      });
      setTypes(typesWithSuperClasses);
      setLoading(false);
    };

    generateOntologyGroups();

    return () => {
      abort();
      setTypes([]);
    };
  }, [assessment, response, abort, get]);

  if (loading) return <p>Fetching data types</p>;
  if (error) return <p>An error occured while retrieving data types. Please try again</p>;

  const superClassGroups = [...new Set(types.map((type) => type.superClass))];

  const updateSelectedGroup = (selectedGroup) => {
    const index = selectedGroups.findIndex((ontologyGroup) => ontologyGroup === selectedGroup);
    if (index === -1) {
      setSelectedGroups([...selectedGroups, selectedGroup]);
      return;
    }
    const filteredGroups = selectedGroups.filter(
      (ontologyGroup) => ontologyGroup !== selectedGroup
    );
    setSelectedGroups(filteredGroups);
  };

  const getTypesInGroup = (selectedGroup) => {
    return types.filter((type) => type.superClass === selectedGroup);
  };

  return (
    <div className="flex flex-col gap-y-2">
      {superClassGroups.sort().map((ontologyGroup) => (
        <AssessmentGroup
          key={ontologyGroup}
          title={capitalize(lowerCase(getURIFragment(ontologyGroup)))}
          show={selectedGroups.includes(ontologyGroup)}
          onToggle={() => updateSelectedGroup(ontologyGroup)}
          className="flex flex-col gap-y-2"
        >
          <GroupedTypes
            assessment={assessment}
            types={getTypesInGroup(ontologyGroup)}
            selectedTypes={selectedTypes}
            setSelectedTypes={setSelectedTypes}
          />
        </AssessmentGroup>
      ))}
    </div>
  );
};
export default AssessmentTypes;

const AssessmentGroup = ({ show, title, onToggle, className: wrapperClassName, children }) => (
  <div aria-labelledby="title" className={classNames(wrapperClassName)}>
    <button
      className={classNames(
        "flex items-center justify-between w-full text-left border-b border-whiteSmoke-700",
        {
          "cursor-default": !onToggle,
        }
      )}
      type="button"
      onClick={onToggle}
    >
      <h2 className="" id="title">
        {title}
      </h2>
      {onToggle && (
        <i
          className={classNames({
            "ri-arrow-up-s-fill !text-xl": show,
            "ri-arrow-down-s-fill !text-xl": !show,
          })}
        />
      )}
    </button>
    {show && children}
  </div>
);
