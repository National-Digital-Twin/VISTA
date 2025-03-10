import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { lazy } from "react";

const InfoPanel = lazy(() => import("./InfoPanel/InfoPanel"));

export const TOOL_NAME = "Asset details panel";

interface ControlPanelContentProps {
  showDependantPanel?: () => void;
}

export function AssetDetailControlPanel({
  showDependantPanel,
}: ControlPanelContentProps) {
  return <InfoPanel showDependantPanel={showDependantPanel} />;
}

export const controlPanelTab = {
  title: "Asset Details",
  icon: faCircleInfo,
  hasFunction: true,
};
