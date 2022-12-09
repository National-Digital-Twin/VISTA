import { ElementsContext } from "context";
import { isEmpty, lowerCase } from "lodash";
import React, { useContext, useEffect } from "react";
import useFetch from "use-http";
import { createAssets, createDependencies } from "./dataset-utils";

const AssessmentTypes = ({ assessment, selectedTypes, setSelectedTypes }) => {
  const assetTypesParams = { assessment };
  const {
    data: types,
    error: typesError,
    loading: loadingTypes,
  } = useFetch(`/assessments/asset-types?${new URLSearchParams(assetTypesParams).toString()}`, {}, [
    assessment,
  ]);
  const { get, response, error } = useFetch();
  const { updateErrors, filterSelectedElements, reset, updateAssets, updateDependencies } =
    useContext(ElementsContext);

  // const [ontologyGroups, setOntologyGroups] = useState({});

  // useEffect(() => {
  //   const typeGroups = {};
  //   if (isEmpty(types)) return;

  //   const generateOntologyGroups = async () => {
  //     for (let type of types) {
  //       const classUri = { classUri: type.uri };
  //       const superClasses = await get(
  //         `ontology/class?${new URLSearchParams(classUri).toString()}`
  //       );

  //       if (response.ok) {
  //         const superClass = superClasses[type.uri]?.superClass[0];
  //         superClass ? (typeGroups[type.uri] = superClass) : (typeGroups[type.uri] = "other");
  //       }
  //     }
  //   };

  //   generateOntologyGroups();
  //   setOntologyGroups(typeGroups);

  //   // console.log(typeGroups);
  // }, [types, response, get]);

  useEffect(() => {
    if (error) updateErrors("Failed to resolve the data");
  }, [error, updateErrors]);

  useEffect(() => {
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
      const assessmentAssets = await getAssets();
      const assessmentDependencies = await getDependencies();

      const assets = await createAssets(assessmentAssets, getAssetGeometry);
      const dependencies = createDependencies(assessmentDependencies);
      console.log({ assets, dependencies });
      updateAssets(assets);
      updateDependencies(dependencies);
      // filterSelectedElements(data.assets, data.dependencies);
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

  if (loadingTypes) return <p>loading</p>;
  if (typesError) return <p>{error.message}</p>;

  const handleTypeChange = (event) => {
    const { target } = event;
    setSelectedTypes((prevSelected) => {
      if (target.checked) return [...prevSelected, target.value];
      return prevSelected.filter((selectedType) => selectedType !== target.value);
    });
  };

  // const groups = [...new Set(Object.values(ontologyGroups))];

  // const getTypesInGroup = (selected) => {
  //   const types = Object.entries(ontologyGroups)
  //     .filter(([key, value]) => value === selected)
  //     .map(([key, value]) => key);
  //   console.log(types);
  // };
  // // console.log(getTypesInGroup("http://ies.data.gov.uk/ontology/ies4#WastewaterComplex"))

  // return groups.map((group) => {
  //   const label = group.includes("#") ? group.split("#")[1] : group;
  //   return (
  //     <ul>
  //       <li className="uppercase border-b">
  //         <button onClick={() => getTypesInGroup(group)}>{lowerCase(label)}</button>
  //       </li>
  //     </ul>
  //   );
  // });

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
