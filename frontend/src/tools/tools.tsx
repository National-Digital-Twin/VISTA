import type Tool from "./Tool";

import featureFlags from "@/config/feature-flags";

const TOOLS: (false | (() => Promise<Tool>))[] = [
  !featureFlags.uiNext && (() => import("./SearchBar")),
  () => import("./Hydrology"),
  () => import("./Weather"),
  () => import("./Tides"),
  () => import("./Train"),
  () => import("./Filter"),
  featureFlags.assetTable && (() => import("./AssetTable")),
  featureFlags.routing && (() => import("./RoadRoute")),
  featureFlags.sandbag && (() => import("./Sandbag")),
  () => import("./LowBridge"),
  () => import("./Legend"),
  () => import("./MapSettingsMenus"),
  () => import("./CompassControls"),
  () => import("./ZoomControls"),
  () => import("./LayersControlPanel"),
  featureFlags.feedbackWidget && (() => import("./FeedbackWidget")),
  () => import("./DynamicProximity"),
  () => import("./FloodAreaControls"),
  () => import("./AssetControls"),
  featureFlags.vulnerablePeople && (() => import("./VulnerablePeople")),
  featureFlags.environmentallySensitiveAreas &&
    (() => import("./EnvironmentallySensitiveAreas")),
  () => import("./FloodNotifDropdown"),
  featureFlags.uiNext && (() => import("./AssetDetails")),
  () => import("./NewMarker"),
];
export default TOOLS;
