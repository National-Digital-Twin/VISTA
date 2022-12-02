import { ElementsContext } from "context";
import { isEmpty, lowerCase } from "lodash";
import React, { useContext, useEffect } from "react";
import useFetch from "use-http";
import { createData } from "./dataset-utils";

const AssessmentTypes = ({ assessment, selectedTypes, setSelectedTypes }) => {
  const assetTypesParams = { assessment };
  const { data: types, error: typesError, loading: loadingTypes } = useFetch(
    `/assessments/asset-types?${new URLSearchParams(assetTypesParams).toString()}`,
    {},
    [assessment]
  );
  const { get, response, error } = useFetch();
  const { updateErrors, filterSelectedElements, reset, updateAssets, updateDependencies } =
    useContext(ElementsContext);

  useEffect(() => {
    if (error) updateErrors("Failed to resolve the data");
  }, [error, updateErrors]);

  useEffect(() => {
    if (isEmpty(selectedTypes)) {
      reset();
      return;
    }

    const types = selectedTypes.map((type) => ["types", type]);
    const params = new URLSearchParams([["assessment", assessment], ...types ]).toString();

    const getAssets = async () => {
      const assets = await get(`assessments/assets?${params}`);
      return response.ok ? assets : []
    };

    const getDependencies = async () => {
      const dependencies = await get(`assessments/dependencies?${params}`);
      return response.ok ? dependencies : []
    };

    const generateData = async () => {
      const assets = await getAssets();
      const dependencies = await getDependencies();

      const data = await createData(assets, dependencies, assessment, get, response);
      updateAssets(data.assets);
      updateDependencies(data.dependencies);
      filterSelectedElements(data.assets, data.dependencies);
    };

    generateData();
  }, [assessment, selectedTypes, response, get, filterSelectedElements, reset, updateAssets, updateDependencies]);

  if (loadingTypes) return <p>loading</p>;
  if (typesError) return <p>{error.message}</p>;

  const handleTypeChange = (event) => {
    const { target } = event;
    setSelectedTypes((prevSelected) => {
      if (target.checked) return [...prevSelected, target.value];
      return prevSelected.filter((selectedType) => selectedType !== target.value);
    });
  };

  return types.map(({ uri, assetCount }) => {
    const label = uri.split("#")[1];
    return (
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
          {lowerCase(label)} [{assetCount}]
        </label>
      </li>
    );
  });
};
export default AssessmentTypes;
