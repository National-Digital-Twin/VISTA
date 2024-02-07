import React from "react";
import { isEmpty } from "lodash";

import { useDependents, useLocalStorage } from "hooks";
import { DetailsSection } from "lib";

import ConnectedAssets from "./ConnectedAssets";

const Dependents = ({ assetUri, dependent, isAsset, isDependency }) => {
  const [expand, setExpand] = useLocalStorage("showDependents", false);
  const {
    isLoading,
    isError,
    error,
    data: dependents,
  } = useDependents(isAsset, isDependency, assetUri, dependent);

  const totalDependents = dependents?.length || 0;

  const handleToggleSection = () => {
    setExpand((prev) => !prev);
  };

  if (isLoading)
    return <p className="px-4 py-3 rounded-lg bg-black-100">Loading dependent assets</p>;
  if (isError) return <p className="px-4 py-3 rounded-lg bg-black-100">{error.message}</p>;
  if (isEmpty(dependents)) return null;

  return (
    <DetailsSection
      id="dependent-assets"
      expand={expand}
      onToggle={handleToggleSection}
      title={`${totalDependents} dependent asset${totalDependents > 1 ? "s" : ""}`}
    >
      <ConnectedAssets connectedAssets={dependents} />
    </DetailsSection>
  );
};

export default Dependents;
