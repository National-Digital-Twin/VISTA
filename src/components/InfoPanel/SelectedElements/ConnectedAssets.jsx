import React, { useContext } from "react";

import { ElementsContext } from "context";
import { isElementCached } from "utils";

import ConnectedAssetDetails from "./ConnectedAssetDetails";

const ConnectedAssets = ({ connectedAssets }) => {
  const { assets } = useContext(ElementsContext);

  return (
    <ul className="grid gap-y-3">
      {Array.isArray(connectedAssets) &&
        connectedAssets
          .sort((a, b) => isElementCached(assets, b.uri) - isElementCached(assets, a.uri))
          .map((asset) => (
            <ConnectedAssetDetails
              key={asset?.uri || asset.error.message}
              error={asset?.error}
              uri={asset?.uri}
              name={asset?.name}
              type={asset?.assetType}
              criticality={asset?.dependentCriticalitySum}
              connectionStrength={asset?.connectionStrength}
              isAdded={isElementCached(assets, asset.uri)}
            />
          ))}
    </ul>
  );
};

export default ConnectedAssets;
