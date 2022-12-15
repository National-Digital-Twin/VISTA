import React, { useCallback, useReducer } from "react";
import elementsReducer, {
  AREA_SELECTION,
  CLEAR_SELECTED,
  DISMISS_ERROR,
  FILTER_SELECTED_ELEMENTS,
  INITIAL_STATE,
  MULTI_SELECT_ELEMENTS,
  RESET,
  SELECT_ELEMENT,
  UPDATE_ASSETS,
  UPDATE_DEPENDENCIES,
  UPDATE_ERRORS,
  UPDATE_LOADING_STATUS,
} from "./elements-reducer";

export const ElementsContext = React.createContext();

export const ElementsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(elementsReducer, INITIAL_STATE);

  const {
    assets,
    dependencies,
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

  const updateDependencies = useCallback((dependencies) => {
    if (!Array.isArray(dependencies)) return;
    dispatch({ type: UPDATE_DEPENDENCIES, dependencies });
  }, []);

  const filterSelectedElements = useCallback((assets, dependencies) => {
    dispatch({ type: FILTER_SELECTED_ELEMENTS, assets, dependencies });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: RESET });
  }, []);

  const onElementClick = useCallback((multiSelect, selectedElement) => {
    if (multiSelect) {
      dispatch({ type: MULTI_SELECT_ELEMENTS, selectedElement });
      return;
    }
    dispatch({ type: SELECT_ELEMENT, selectedElement });
  }, []);

  const onAreaSelect = (selectedElements) => {
    if (!Array.isArray(selectedElements)) return;
    dispatch({ type: AREA_SELECTION, selectedElements });
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

  const setLoading = useCallback((loading) => {
    dispatch({ type: UPDATE_LOADING_STATUS, loading });
  }, []);

  return (
    <ElementsContext.Provider
      value={{
        assets,
        dependencies,
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
        onAreaSelect,
        onElementClick,
        reset,
        setLoading,
        updateAssets,
        updateDependencies,
        updateErrors,
      }}
    >
      {children}
    </ElementsContext.Provider>
  );
};
