import ColorScale from "color-scales";
import { getUniqueElements, isAsset } from "utils";

export const CLEAR_SELECTED = "CLEAR_SELECTED";
export const RESET = "RESET";
export const DISMISS_ERROR = "DISMISS_ERROR";
export const FILTER_SELECTED_ELEMENTS = "FILTER_SELECTED_ELEMENTS";
export const SELECT_ELEMENT = "SELECT_ELEMENT";
export const MULTI_SELECT_ELEMENTS = "MULTI_SELECT_ELEMENTS";
export const AREA_SELECTION = "AREA_SELECTION";
export const ADD_ASSETS = "ADD_ASSETS";
export const REMOVE_ASSETS_BY_TYPE = "REMOVE ASSETS BY TYPE";
export const REMOVE_DEPENDENCIES_BY_TYPE = "REMOVE DEPENDENCIES BY TYPE";
export const REMOVE_ELEMENTS_BY_TYPE = "REMOVE ELEMENTS BY TYPE";
export const ADD_DEPENDENCIES = "ADD_DEPENDENCIES";
export const UPDATE_ERRORS = "UPDATE_ERRORS";

const getColorScale = (min, max) => {
  return new ColorScale(min, max === 0 ? 100 : max, ["#35C035", "#FFB60A", "#FB3737"], 1);
};

export const INITIAL_STATE = {
  loading: false,
  assets: [],
  dependencies: [],
  errors: [],
  selectedElements: [],
  iconStyles: {},
  maxAssetCriticality: 0,
  maxAssetTotalCxns: 0,
  assetCriticalityColorScale: {},
  cxnCriticalityColorScale: getColorScale(1, 3),
  totalCxnsColorScale: {},
};

const getAllCounts = (assets) => assets.map((asset) => asset.dependent.count);
const getAllCriticalitySums = (assets) => assets.map((asset) => asset.dependent.criticalitySum);

const elementsReducer = (state, action) => {
  switch (action.type) {
    case ADD_ASSETS: {
      const assets = action.assets;
      const minTotalCount = Math.min(...getAllCounts(assets));
      const maxTotalCount = Math.max(...getAllCounts(assets));
      const minCriticalitySum = Math.min(...getAllCriticalitySums(assets));
      const maxCriticalitySum = Math.max(...getAllCriticalitySums(assets));

      assets.forEach((asset) => {
        asset.setCountColorScale(minTotalCount, maxTotalCount);
        asset.setCriticalitySumColorScale(minCriticalitySum, maxCriticalitySum);
      });

      return { ...state, assets };
    }
    case ADD_DEPENDENCIES:
      return {
        ...state,
        dependencies: action.dependencies,
      };
    case REMOVE_ELEMENTS_BY_TYPE: {
      const { typeUri } = action;
      const assets = state.assets.filter((asset) => asset.type !== typeUri);
      const dependencies = state.dependencies.filter(
        (dependency) =>
          dependency.dependent.type !== typeUri || dependency.provider.type !== typeUri
      );
      return { ...state, assets, dependencies };
    }
    case FILTER_SELECTED_ELEMENTS: {
      const selectedElements = state.selectedElements.filter((selectedElement) => {
        return isAsset(selectedElement)
          ? state.assets.some((asset) => asset.uri === selectedElement.uri)
          : state.dependencies.some((dependency) => dependency.uri === selectedElement.uri);
      });
      return {
        ...state,
        selectedElements,
      };
    }
    case SELECT_ELEMENT:
      return {
        ...state,
        selectedElements: action.selectedElements,
      };
    case MULTI_SELECT_ELEMENTS: {
      const selectedElements = getUniqueElements([
        ...state.selectedElements,
        ...action.selectedElements,
      ]);
      return {
        ...state,
        selectedElements,
      };
    }
    case AREA_SELECTION: {
      return { ...state, selectedElements: action.selectedElements };
    }
    case CLEAR_SELECTED:
      return { ...state, selectedElements: [] };
    case RESET:
      return INITIAL_STATE;
    case UPDATE_ERRORS:
      return { ...state, errors: [...new Set([...state.errors, action.error])] };
    case DISMISS_ERROR:
      return { ...state, errors: state.errors.filter((error) => error !== action.error) };
    default:
      // eslint-disable-next-line
      console.error(`Unhandled action type ${action.type}`);
      return state;
  }
};
export default elementsReducer;
