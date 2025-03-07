import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { lazy } from "react";

const InfoPanel = lazy(() => import("./InfoPanel/InfoPanel"));

export const TOOL_NAME = "Asset details panel";

export function ControlPanelContent() {
  return <InfoPanel />;
}

export const controlPanelTab = {
  title: "Asset Details",
  icon: faCircleInfo,
};
