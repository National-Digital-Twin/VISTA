import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { lazy } from "react";

const InfoPanel = lazy(() => import("./InfoPanel/InfoPanel"));

export const TOOL_NAME = "Asset details panel";

interface AssetDetailControlPanelContentProps {
  showConnectedAssets: () => void;
  setConnectedAssetData: (data: any) => void;
}

export function AssetDetailControlPanel({
  showConnectedAssets,
  setConnectedAssetData,
}: AssetDetailControlPanelContentProps) {
  return (
    <InfoPanel
      showConnectedAssets={showConnectedAssets}
      setConnectedAssetData={setConnectedAssetData}
    />
  );
}

export const controlPanelTab = {
  title: "Asset Details",
  icon: faCircleInfo,
  hasFunction: true,
};
