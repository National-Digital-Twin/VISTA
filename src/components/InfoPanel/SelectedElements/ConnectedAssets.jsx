import React, { useContext } from "react";

import { ElementsContext } from "context";
import { getURIFragment, isElementCached } from "utils";

import AssetDetails from "./AssetDetails";

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
              <AssetDetails
                key={uri || asset.error.message}
                error={asset?.error}
                uri={uri}
                name={asset?.name}
                type={getURIFragment(asset?.assetType)}
                criticality={asset?.dependentCriticalitySum}
                connectionStrength={asset?.connectionStrength}
                backgroundColor={isAdded ? asset.styles?.defaultStyles?.dark?.backgroundColor : "#A3A3A3"}
                color={isAdded ? asset.styles?.defaultStyles?.dark?.color : "#333"}
                icon={asset.styles?.defaultIcons?.faIcon}
              />
            );
          })}
    </ul>
  );
};

export default ConnectedAssets;
