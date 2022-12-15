import { isEmpty, lowerCase } from "lodash";
import { useFetch } from "use-http";
import React, { useContext, useEffect } from "react";

import { ElementsContext } from "context";
import { getURIFragment } from "utils";

import { createAssets, createDependencies } from "./dataset-utils";

const GroupedTypes = ({ assessment, types, selectedTypes, setSelectedTypes }) => {
  const { get, error, response } = useFetch();
  const {
    filterSelectedElements,
    reset,
    setLoading,
    updateAssets,
    updateDependencies,
    updateErrors,
  } = useContext(ElementsContext);

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
    setLoading,
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

export default GroupedTypes;
