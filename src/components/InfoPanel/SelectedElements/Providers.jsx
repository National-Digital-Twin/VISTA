import React from "react";
import { isEmpty } from "lodash";

import { useLocalStorage, useProviders } from "hooks";
import { DetailsSection } from "lib";

import ConnectedAssets from "./ConnectedAssets";

const Providers = ({ isAsset, isDependency, assetUri, provider }) => {
  const {
    isLoading,
    isError,
    error,
    data: providers,
  } = useProviders(isAsset, isDependency, assetUri, provider);
  const [expand, setExpand] = useLocalStorage("showProviders", false);

  const totalProviders = providers?.length || 0;

  const handleToggleSection = () => {
    setExpand((prev) => !prev);
  };

  if (isLoading) return <DetailsSection expand={false} title="Loading provider assets" show />;
  if (isError) return <p>{error.message}</p>;
  if (isEmpty(providers)) return null;

  return (
    <DetailsSection
      id="provider-assets"
      expand={expand}
      onToggle={handleToggleSection}
      title={`${totalProviders} provider asset${totalProviders > 1 ? "s" : ""}`}
    >
      <ConnectedAssets connectedAssets={providers} />
    </DetailsSection>
  );
};

export default Providers;
