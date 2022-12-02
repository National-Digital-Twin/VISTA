import ColorScale from "color-scales";
// import { isEmpty } from "lodash";
import { Asset, Connection } from "models";
import { isAsset } from "utils";

export const CLEAR_SELECTED = "CLEAR_SELECTED";
export const RESET = "RESET";
export const DISMISS_ERROR = "DISMISS_ERROR";
export const FILTER_SELECTED_ELEMENTS = "FILTER_SELECTED_ELEMENTS";
export const SELECT_ELEMENT = "SELECT_ELEMENT";
export const MULTI_SELECT_ELEMENTS = "MULTI_SELECT_ELEMENTS";
export const AREA_SELECTION = "AREA_SELECTION";
export const UPDATE_ASSETS = "UPDATE_ASSETS";
export const UPDATE_DEPENDENCIES = "UPDATE_DEPENDENCIES";
export const UPDATE_ERRORS = "UPDATE_ERRORS";

const getColorScale = (min, max) => {
  return new ColorScale(min, max === 0 ? 100 : max, ["#35C035", "#FFB60A", "#FB3737"], 1);
};

export const INITIAL_STATE = {
  assets: [],
  dependencies: [],
  errors: [],
  selectedElements: [],
  selectedDetails: [],
  maxAssetCriticality: 0,
  maxAssetTotalCxns: 0,
  assetCriticalityColorScale: {},
  cxnCriticalityColorScale: getColorScale(1, 3),
  totalCxnsColorScale: {},
};

const getAllCounts = (assets) => assets.map((asset) => asset.dependent.count);
const getAllCriticalitySums = (assets) => assets.map((asset) => asset.dependent.criticalitySum);
const createElement = (elem) => (isAsset(elem) ? new Asset(elem) : new Connection(elem));

const elementsReducer = (state, action) => {
  switch (action.type) {
    case UPDATE_ASSETS: {
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
    case UPDATE_DEPENDENCIES:
      return {
        ...state,
        dependencies: action.dependencies,
      };
    case FILTER_SELECTED_ELEMENTS: {
      const selectedElements = state.selectedElements.filter((elem) => {
        return isAsset(elem)
          ? action.assets.some((asset) => asset.id === elem.id)
          : action.dependencies.some((dependency) => dependency.id === elem.id);
      });
      return {
        ...state,
        selectedElements,
      };
    }
    case SELECT_ELEMENT:
      return {
        ...state,
        selectedElements: [createElement(action.selectedElement)],
      };
    case MULTI_SELECT_ELEMENTS: {
      const getSelected = () => {
        const index = state.selectedElements.findIndex(
          (selectedElement) => selectedElement.id === action.selectedElement.id
        );
        if (index === -1) return [...state.selectedElements, createElement(action.selectedElement)];
        return state.selectedElements.filter(
          (selectedElement) => selectedElement.id !== action.selectedElement.id
        );
      };

      return {
        ...state,
        selectedElements: getSelected(),
      };
    }
    case AREA_SELECTION: {
      const selectedElements = action.selectedElements.map((selected) => createElement(selected));
      return { ...state, selectedElements };
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
