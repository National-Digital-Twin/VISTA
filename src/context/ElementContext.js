import React, { useCallback, useReducer } from "react";
import elementsReducer, {
  CLEAR_SELECTED,
  DISMISS_ERROR,
  FILTER_SELECTED,
  INITIAL_STATE,
  MULTI_SELECT_ELEMENTS,
  RESET,
  SELECT_ELEMENT,
  UPDATE_ASSETS,
  UPDATE_CONNECTIONS,
  UPDATE_ERRORS,
} from "./elements-reducer";

export const ElementsContext = React.createContext();

export const ElementsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(elementsReducer, INITIAL_STATE);

  const {
    assets,
    connections,
    errors,
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
    dispatch({ type: FILTER_SELECTED, assets, connections });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: RESET });
  }, []);

  const onElementClick = useCallback((event, selectedElement) => {
    dispatch({ type: SELECT_ELEMENT, event, selectedElement });
  }, []);

  const onMultiSelect = (selectedElements) => {
    dispatch({ type: MULTI_SELECT_ELEMENTS, selectedElements });
  };

  const updateErrors = useCallback((msg) => {
    dispatch({ type: UPDATE_ERRORS, error: msg });
  }, []);

  const dismissErrorNotification = (error) => {
    dispatch({ type: DISMISS_ERROR, error });
  };

  const clearSelectedElements = () => {
    dispatch({ type: CLEAR_SELECTED });
  };

  return (
    <ElementsContext.Provider
      value={{
        assets,
        connections,
        errors,
        selectedElements,
        maxAssetCriticality,
        maxAssetTotalCxns,
        assetCriticalityColorScale,
        cxnCriticalityColorScale,
        totalCxnsColorScale,
        clearSelectedElements,
        dismissErrorNotification,
        filterSelectedElements,
        onElementClick,
        onMultiSelect,
        reset,
        updateAssets,
        updateConnections,
        updateErrors,
      }}
    >
      {children}
    </ElementsContext.Provider>
  );
};
