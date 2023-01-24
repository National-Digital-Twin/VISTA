import { lowerCase } from "lodash";
import { useFetch } from "use-http";
import React, { useContext, useEffect, useMemo } from "react";

import config from "config/app-config";
import { ElementsContext } from "context";
import { ASSESSMENTS_ENDPOINT, ASSET_PARTS_ENDPOINT } from "constants/endpoints";
import { getURIFragment } from "utils";

import { createAssets, createDependencies } from "./dataset-utils";

const GroupedTypes = ({ expand, assessment, types, setIsGeneratingData }) => {
  const { get, error, response } = useFetch();
  const { get: getFromOntologyServer, response: responseFromOntologyServer } = useFetch(
    config.api.ontology
  );
  const { addElements, removeElementsByType, updateErrors } = useContext(ElementsContext);

  const sortedTypes = useMemo(() => {
    const alphabeticallySortedTypes = types.sort((a, b) => {
      const aUri = lowerCase(getURIFragment(a?.uri));
      const bUri = lowerCase(getURIFragment(b?.uri));
      return aUri.localeCompare(bUri);
    });
    return alphabeticallySortedTypes;
  }, [types]);

  useEffect(() => {
    if (error) updateErrors("Could not add data. Reason: Failed to resolve the data");
  }, [error, updateErrors]);

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

  const getIconStyle = async (type) => {
    const queryParam = new URLSearchParams({ uri: type }).toString();
    const style = await getFromOntologyServer(`styles/class?${queryParam}`);
    return responseFromOntologyServer.ok ? style : undefined;
  };

  const handleTypeChange = async (event) => {
    const { target } = event;
    const type = target.value;
    const typeIsChecked = target.checked;

    if (!assessment) return;
    if (typeIsChecked) {
      const getData = async () => {
        setIsGeneratingData(true);
        const params = new URLSearchParams([
          ["assessment", assessment],
          ["types", type],
        ]).toString();

        const iconStyle = getIconStyle(type);
        const assets = getAssets(params);
        const dependencies = getDepedencies(params);
        const data = Promise.all([assets, dependencies, iconStyle]);
        return data;
      };

      getData().then(async ([assets, dependencies, iconStyle]) => {
        const createdAssets = await createAssets(assets, iconStyle, getAssetGeometry);
        const createdDependencies = createDependencies(dependencies);
        addElements(createdAssets, createdDependencies);
        setIsGeneratingData(false);
      });
      return;
    }

    removeElementsByType(type);
    setIsGeneratingData(false);
  };

  const renderType = (type) => {
    if (!type?.uri || !type.assetCount) return null;
    const { uri, assetCount } = type;
    return (
      <li key={uri} className="inline-flex gap-x-1 text-xs">
        <input type="checkbox" value={uri} id={uri} onChange={handleTypeChange} className="w-3.5" />
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
