import { capitalize, isEmpty, lowerCase } from "lodash";
import classNames from "classnames";
import React, { useContext, useEffect, useState } from "react";
import useFetch from "use-http";

import { ElementsContext } from "context";
import { getURIFragment } from "utils";
import { createAssets, createDependencies } from "./dataset-utils";

const AssessmentTypes = ({ assessment, selectedTypes, setSelectedTypes }) => {
  const { get, error, response } = useFetch();

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

      for (let i = 0; i < types.length; i++) {
        const typeUri = types[i].uri;
        const classUri = { classUri: typeUri };
        const superClasses = await get(
          `ontology/class?${new URLSearchParams(classUri).toString()}`
        );

        if (response.ok) {
          const superClass = superClasses[typeUri]?.superClass[0] ?? "other";
          types[i].superClass = superClass;
        }
      }
      setTypes(types);
      setLoading(false);
    };

    generateOntologyGroups();
  }, [assessment, response, get]);

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
          <AssessmentTypeItems
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

const AssessmentTypeItems = ({ assessment, types, selectedTypes, setSelectedTypes }) => {
  const { get, error, response } = useFetch();
  const { updateErrors, filterSelectedElements, reset, updateAssets, updateDependencies } =
    useContext(ElementsContext);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (error) updateErrors("Could not add data. Reason: Failed to resolve the data");
  }, [error, updateErrors]);

  useEffect(() => {
    if (!assessment) return;
    if (isEmpty(selectedTypes)) {
      reset();
      return;
    }

    const types = selectedTypes.map((type) => ["types", type]);
    const params = new URLSearchParams([["assessment", assessment], ...types]).toString();

    const getAssets = async () => {
      const assets = await get(`assessments/assets?${params}`);
      return response.ok ? assets : [];
    };

    const getDependencies = async () => {
      const dependencies = await get(`assessments/dependencies?${params}`);
      return response.ok ? dependencies : [];
    };

    const getAssetGeometry = async (uri) => {
      const assetUri = { assetUri: uri };
      const linearAssets = await get(`asset/parts?${new URLSearchParams(assetUri).toString()}`);
      return response.ok ? linearAssets : [];
    };

    const generateData = async () => {
      setLoading(true);
      const assessmentAssets = await getAssets();
      const assessmentDependencies = await getDependencies();

      const assets = await createAssets(assessmentAssets, getAssetGeometry);
      const dependencies = createDependencies(assessmentDependencies);
      updateAssets(assets);
      updateDependencies(dependencies);
      filterSelectedElements(assets, dependencies);
      setLoading(false);
    };

    generateData();
  }, [
    assessment,
    selectedTypes,
    response,
    get,
    filterSelectedElements,
    reset,
    updateAssets,
    updateDependencies,
  ]);

  const handleTypeChange = (event) => {
    const { target } = event;
    setSelectedTypes((prevSelected) => {
      if (target.checked) return [...prevSelected, target.value];
      return prevSelected.filter((selectedType) => selectedType !== target.value);
    });
  };

  return (
    <ul className="flex flex-col gap-y-2">
      {types.map(({ uri, assetCount }) => (
        <li key={uri} className="inline-flex gap-x-1 text-xs">
          <input
            type="checkbox"
            value={uri}
            id={uri}
            checked={selectedTypes.includes(uri)}
            onChange={handleTypeChange}
            className="w-3.5"
          />
          <label htmlFor={uri} className="uppercase">
            {lowerCase(getURIFragment(uri))} [{assetCount}]
          </label>
        </li>
      ))}
    </ul>
  );
};
