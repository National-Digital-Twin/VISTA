import type Tool from "./Tool";

import featureFlags from "@/config/feature-flags";

const TOOLS: (false | (() => Promise<Tool>))[] = [
  !featureFlags.uiNext && (() => import("./SearchBar")),
  () => import("./Train"),
  () => import("./Filter"),
  featureFlags.assetTable && (() => import("./AssetTable")),
  featureFlags.routing && (() => import("./RoadRoute")),
  () => import("./LowBridge"),
  () => import("./Legend"),
  () => import("./MapSettingsMenus"),
  () => import("./CompassControls"),
  () => import("./ZoomControls"),
  () => import("./LayersControlPanel"),
  () => import("./Polygons"),
  () => import("./DrawnPolygons"),
  featureFlags.feedbackWidget && (() => import("./FeedbackWidget")),
  () => import("./DynamicProximity"),
  () => import("./FloodAreaControls"),
  () => import("./AssetControls"),
  featureFlags.environmentallySensitiveAreas &&
    (() => import("./EnvironmentallySensitiveAreas")),
  () => import("./FloodNotifDropdown"),
  featureFlags.uiNext && (() => import("./AssetDetails")),
  () => import("./NewMarker"),
];
export default TOOLS;
