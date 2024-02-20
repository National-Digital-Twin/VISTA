import React, { useContext, useEffect, useMemo } from "react";
import { lowerCase } from "lodash";
import { useFetch } from "use-http";
import { useOntologyStyles } from "@telicent-io/ds";

import { ASSESSMENTS_ENDPOINT, ASSET_PARTS_ENDPOINT } from "constants/endpoints";
import { ElementsContext } from "context";
import { getURIFragment } from "utils";

import { createAssets, createDependencies } from "./dataset-utils";

const GroupedTypes = ({
  expand,
  assessment,
  types,
  selectedTypes,
  setSelectedTypes,
  setIsGeneratingData,
}) => {
  const { get, error, response } = useFetch();
  const { findIcon } = useOntologyStyles();
  const { addElements, removeElementsByType, updateErrorNotifications } =
    useContext(ElementsContext);

  const sortedTypes = useMemo(() => {
    const alphabeticallySortedTypes = types.sort((a, b) => {
      const aUri = lowerCase(getURIFragment(a?.uri));
      const bUri = lowerCase(getURIFragment(b?.uri));
      return aUri.localeCompare(bUri);
    });
    return alphabeticallySortedTypes;
  }, [types]);

  useEffect(() => {
    if (error) updateErrorNotifications("Could not add data. Reason: Failed to resolve the data");
  }, [error, updateErrorNotifications]);

  const getAssets = async (params) => {
    const assets = await get(`${ASSESSMENTS_ENDPOINT}/assets?${params}`);
    return response.ok ? assets : [];
  };

  const getDepedencies = async (params) => {
    const assets = await get(`${ASSESSMENTS_ENDPOINT}/dependencies?${params}`);
    return response.ok ? assets : [];
  };

  const getAssetGeometry = async (uri) => {
    const assetUri = { assetUri: uri };
    const linearAssets = await get(
      `${ASSET_PARTS_ENDPOINT}?${new URLSearchParams(assetUri).toString()}`
    );
    return response.ok ? linearAssets : [];
  };

  const handleTypeChange = async (event) => {
    const { target } = event;
    const type = target.value;
    const typeIsChecked = target.checked;

    if (!assessment) return;
    if (typeIsChecked) {
      const types = [...selectedTypes, type];
      setSelectedTypes(types);

      const getData = async () => {
        setIsGeneratingData(true);
        const typeParams = types.map((type) => ["types", type]);
        const params = new URLSearchParams([["assessment", assessment], ...typeParams]).toString();

        const [assets, dependencies] = await Promise.all([
          getAssets(params),
          getDepedencies(params),
        ]);
        return { assets, dependencies };
      };

      getData().then(async ({ assets, dependencies }) => {
        const createdAssets = await createAssets(assets, findIcon, getAssetGeometry);
        const createdDependencies = createDependencies(dependencies);
        addElements(createdAssets, createdDependencies);
        setIsGeneratingData(false);
      });
      return;
    }

    removeElementsByType(type);
    setIsGeneratingData(false);
    setSelectedTypes((prevSelectedTypes) =>
      prevSelectedTypes.filter((prevSelectedType) => prevSelectedType !== type)
    );
  };

  const renderType = (type) => {
    if (!type?.uri || !type.assetCount) return null;
    const { uri, assetCount } = type;
    return (
      <li key={uri} className="inline-flex text-xs gap-x-1">
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

  if (!expand) return null;

  return <ul className="flex flex-col gap-y-2">{sortedTypes.map(renderType)}</ul>;
};

export default GroupedTypes;
