import { useContext } from "react";

import ConnectedAssetDetails from "./ConnectedAssetDetails";

import { ElementsContext } from "@/context/ElementContext";
import { isElementCached } from "@/utils";

export interface ConnectedAssetsProps {
  /** Assets which we consider connected */
  connectedAssets: {
    uri: string;
    error?: Error;
    name: string;
    assetType: string;
    dependentCriticalitySum: number;
    connectionStrength: number;
  }[];
}

export default function ConnectedAssets({
  connectedAssets,
}: ConnectedAssetsProps) {
  const { assets } = useContext(ElementsContext);

  return (
    <ul className="grid gap-y-3">
      {Array.isArray(connectedAssets) &&
        connectedAssets
          .sort(
            (a, b) =>
              +isElementCached(assets, b.uri) - +isElementCached(assets, a.uri),
          )
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
}
