import {
  createSelectedAssetFeatures,
  createSelectedConnectionFeatures,
  createSelectedSegmentFeatures,
} from "./mapboxFeatures";

export const INITIAL_STATE = {
  selectedAssets: [],
  selectedDependacies: [],
  selectedSegments: [],
  selectedPolygons: [],
  controls: [],
};

export const RESET_STATE = "RESET_STATE";
export const HIGHLIGHT_SELECTED_ELEMENTS = "HIGHLIGHT_SELECTED_ELEMENTS";
export const UPDATE_SELECTED_POLYGONS = "UPDATE_SELECTED_POLYGONS"

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
    case UPDATE_SELECTED_POLYGONS: 
      return { ...state, selectedPolygons: action.selectedPolygons}
    default:
      // eslint-disable-next-line
      console.error(`Unhandled action type ${action.type}`);
      return state;
  }
};
export default mapReducer;
