import { useContext } from "react";

import ConnectedAssetDetails from "./ConnectedAssetDetails";
import { ElementsContext } from "@/context/ElementContext";
import { isElementCached } from "@/utils";

export interface ConnectedAssetsProps {
  /** Assets which we consider connected */
  readonly connectedAssets: {
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

  const sortedAssets = connectedAssets.toSorted(
    (a, b) => +isElementCached(assets, b.uri) - +isElementCached(assets, a.uri),
  );

  return (
    <ul className="grid gap-y-3">
      {sortedAssets.map((asset) => (
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
