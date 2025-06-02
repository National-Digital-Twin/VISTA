// Define the initial feature flags
const featureFlags = {
  devTools: !import.meta.env.PROD,
  /**
   * Enables showing a route between two points on the map selected by the user
   */
  routing: true,
  // Next-generation UI with a control panel
  uiNext: true,
  pageHeader: false,
  feedbackWidget: false,
  /**
   * Enables showing areas marked as environmentally sensitive as translucent polygons
   */
  environmentallySensitiveAreas: true,
  /**
   * Enables a table of assets as a sidebar button
   */
  assetTable: true,
};

// Function to update feature flags based on URL parameters
export function updateFeatureFlagsFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  for (const key in featureFlags) {
    const urlParamKey = `feat-${key}`;
    if (urlParams.has(urlParamKey)) {
      featureFlags[key] = urlParams.get(urlParamKey) === "true";
    }
  }
}

// Export the feature flags
export default featureFlags;
