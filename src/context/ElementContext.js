import ColorScale from "color-scales";
import React, { useCallback, useReducer, useRef } from "react";
import { Asset, Connection } from "../models";
import { isAsset } from "../utils";

const UPDATE_ASSETS = "UPDATE_ASSETS";
const UPDATE_CONNECTIONS = "UPDATE_CONNECTIONS";
const UPDATE_SELECTED_ELEMENTS = "UPDATE_SELECTED_ELEMENTS";
const CLEAR_SELECTED = "CLEAR_SELECTED";
const RESET = "RESET";

const getColorScale = (min, max) =>
  new ColorScale(min, max === 0 ? 100 : max, ["#35C035", "#FFB60A", "#FB3737"], 1);

const INITIAL_STATE = {
  assets: [],
  connections: [],
  selectedElements: [],
  selectedDetails: [],
  maxAssetCriticality: 0,
  maxAssetTotalCxns: 0,
  assetCriticalityColorScale: {},
  cxnCriticalityColorScale: getColorScale(1, 3),
  totalCxnsColorScale: {},
};

const getAllTotalCxns = (assets) => assets.map((asset) => asset.totalCxns);

const getAllCriticalities = (assets) => assets.map((asset) => asset.criticality);

const elementsReducer = (state, action) => {
  switch (action.type) {
    case UPDATE_ASSETS: {
      const assets = action.assets;
      const maxAssetCriticality = Math.max(...getAllCriticalities(assets));
      const minAssetCriticality = Math.min(...getAllCriticalities(assets));
      const maxAssetTotalCxns = Math.max(...getAllTotalCxns(assets));
      const minAssetTotalCxns = Math.min(...getAllTotalCxns(assets));

      return {
        ...state,
        assets,
        maxAssetCriticality,
        maxAssetTotalCxns,
        assetCriticalityColorScale: getColorScale(minAssetCriticality, maxAssetCriticality),
        totalCxnsColorScale: getColorScale(minAssetTotalCxns, maxAssetTotalCxns),
      };
    }
    case UPDATE_CONNECTIONS:
      return {
        ...state,
        connections: action.connections,
      };
    case UPDATE_SELECTED_ELEMENTS: {
      const createElement = (elem) => (isAsset(elem) ? new Asset(elem) : new Connection(elem));

      if (action.assets && action.connections) {
        const selectedElements = state.selectedElements.filter((elem) => {
          return isAsset(elem)
            ? action.assets.some((asset) => asset.id === elem.id)
            : action.connections.some((connection) => connection.id === elem.id);
        });
        return {
          ...state,
          selectedElements,
        };
      }

      if (action.event?.originalEvent?.shiftKey ?? action.event.shiftKey) {
        const getSelected = () => {
          const index = state.selectedElements.findIndex(
            (selectedElement) => selectedElement.id === action.selectedElement.id
          );
          if (index === -1)
            return [...state.selectedElements, createElement(action.selectedElement)];
          return state.selectedElements.filter(
            (selectedElement) => selectedElement.id !== action.selectedElement.id
          );
        };

        return {
          ...state,
          selectedElements: getSelected(),
        };
      }
      return {
        ...state,
        selectedElements: [createElement(action.selectedElement)],
      };
    }
    case CLEAR_SELECTED:
      return { ...state, selectedElements: [] };
    case RESET:
      return INITIAL_STATE;
    default:
      // eslint-disable-next-line
      console.error(`Unhandled action type ${action.type}`);
      return state;
  }
};

export const ElementsContext = React.createContext();

export const ElementsProvider = ({ children }) => {
  const cyRef = useRef({});
  const [state, dispatch] = useReducer(elementsReducer, INITIAL_STATE);

  const {
    assets,
    connections,
    selectedElements,
    maxAssetCriticality,
    maxAssetTotalCxns,
    assetCriticalityColorScale,
    cxnCriticalityColorScale,
    totalCxnsColorScale,
  } = state;

  const updateAssets = useCallback((assets) => {
    if (!Array.isArray(assets)) return;
    dispatch({ type: UPDATE_ASSETS, assets });
  }, []);

  const updateConnections = useCallback((connections) => {
    if (!Array.isArray(connections)) return;
    dispatch({ type: UPDATE_CONNECTIONS, connections });
  }, []);

  const filterSelectedElements = useCallback((assets, connections) => {
    dispatch({ type: UPDATE_SELECTED_ELEMENTS, assets, connections });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: RESET });
  }, []);

  const onElementClick = (event, selectedElement) => {
    dispatch({ type: UPDATE_SELECTED_ELEMENTS, event, selectedElement });
  };

  const clearSelectedElements = () => {
    dispatch({ type: CLEAR_SELECTED });
  };

  return (
    <ElementsContext.Provider
      value={{
        cyRef,
        assets,
        connections,
        selectedElements,
        maxAssetCriticality,
        maxAssetTotalCxns,
        assetCriticalityColorScale,
        cxnCriticalityColorScale,
        totalCxnsColorScale,
        clearSelectedElements,
        filterSelectedElements,
        onElementClick,
        reset,
        updateAssets,
        updateConnections,
      }}
    >
      {children}
    </ElementsContext.Provider>
  );
};
