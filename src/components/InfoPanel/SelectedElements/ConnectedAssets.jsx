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
          .map((asset) => {
            const isAdded = isElementCached(assets, asset.uri);
            const uri = asset?.uri;
            return (
              <ConnectedAssetDetails
                key={uri || asset.error.message}
                error={asset?.error}
                uri={uri}
                name={asset?.name}
                type={asset?.assetType}
                criticality={asset?.dependentCriticalitySum}
                connectionStrength={asset?.connectionStrength}
                isAdded={isAdded}
              />
            );
          })}
    </ul>
  );
};

export default ConnectedAssets;
