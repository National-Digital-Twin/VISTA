import { isEmpty, lowerCase } from "lodash";
import { useFetch } from "use-http";
import React, { useContext, useEffect } from "react";

import { ElementsContext } from "context";
import { ASSESSMENTS_ENDPOINT, ASSET_PARTS_ENDPOINT } from "constants/endpoints";
import { getURIFragment } from "utils";

import { createAssets, createDependencies } from "./dataset-utils";
import classNames from "classnames";

const GroupedTypes = ({ expand, assessment, types, selectedTypes, setSelectedTypes, setIsGeneratingData }) => {
  const { get, error, response } = useFetch();
  const { filterSelectedElements, reset, updateAssets, updateDependencies, updateErrors } =
    useContext(ElementsContext);

  useEffect(() => {
    if (error) updateErrors("Could not add data. Reason: Failed to resolve the data");
  }, [error, updateErrors]);

  useEffect(() => {
    if (!assessment) return;
    if (isEmpty(selectedTypes)) {
      reset();
      return;
    }

    const getAssessmentElements = async (elementType) => {
      const types = selectedTypes.map((type) => ["types", type]);
      const params = new URLSearchParams([["assessment", assessment], ...types]).toString();
      const elements = await get(`${ASSESSMENTS_ENDPOINT}/${elementType}?${params}`);

      return response.ok ? elements : [];
    };

    const getAssetGeometry = async (uri) => {
      const assetUri = { assetUri: uri };
      const linearAssets = await get(
        `${ASSET_PARTS_ENDPOINT}?${new URLSearchParams(assetUri).toString()}`
      );
      return response.ok ? linearAssets : [];
    };

    const generateData = async () => {
      setIsGeneratingData(true);
      const { assets, dependencies } = await Promise.all(
        ["assets", "dependencies"].map(async (elementType) => ({
          [elementType]: await getAssessmentElements(elementType),
        }))
      ).then(async (assessmentElements) => {
        const assets = await createAssets(assessmentElements[0].assets, getAssetGeometry);
        const dependencies = createDependencies(assessmentElements[1].dependencies);
        return { assets, dependencies };
      });

      updateAssets(assets);
      updateDependencies(dependencies);
      filterSelectedElements(assets, dependencies);
      setIsGeneratingData(false);
    };

    generateData();
  }, [
    assessment,
    selectedTypes,
    response,
    get,
    filterSelectedElements,
    reset,
    setIsGeneratingData,
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

  const sortedTypes = types.sort((a, b) => {
    const aUri = lowerCase(getURIFragment(a?.uri));
    const bUri = lowerCase(getURIFragment(b?.uri));
    return aUri.localeCompare(bUri);
  });

  const renderType = (type) => {
    if (!type?.uri || !type.assetCount) return null;
    const { uri, assetCount } = type;
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
          {lowerCase(getURIFragment(uri))} [{assetCount}]
        </label>
      </li>
    );
  };

  return (
    <ul className={classNames("flex flex-col gap-y-2", { hidden: !expand })}>
      {sortedTypes.map(renderType)}
    </ul>
  );
};

export default GroupedTypes;
