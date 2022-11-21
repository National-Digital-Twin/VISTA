import {
  createSelectedAssetFeatures,
  createSelectedConnectionFeatures,
  createSelectedSegmentFeatures,
} from "./mapboxFeatures";

export const INITIAL_STATE = {
  selectedAssets: [],
  selectedDependacies: [],
  selectedSegments: [],
  controls: [],
  polygons: []
};

export const RESET_STATE = "RESET_STATE";
export const HIGHLIGHT_SELECTED_ELEMENTS = "HIGHLIGHT_SELECTED_ELEMENTS";

const mapReducer = (state, action) => {
  switch (action.type) {
    case HIGHLIGHT_SELECTED_ELEMENTS: {
      const {
        assets,
        selectedElements,
        maxAssetCriticality,
        assetCriticalityColorScale,
        cxnCriticalityColorScale,
      } = action;

      const selectedAssets = createSelectedAssetFeatures(
        assets,
        assetCriticalityColorScale,
        maxAssetCriticality,
        selectedElements
      );
      const selectedDependacies = createSelectedConnectionFeatures(
        assets,
        cxnCriticalityColorScale,
        selectedElements
      );
      const selectedSegments = createSelectedSegmentFeatures(
        selectedElements,
        assetCriticalityColorScale,
        assets
      );

      return { ...state, selectedAssets, selectedDependacies, selectedSegments };
    }
  }
};
export default mapReducer;
