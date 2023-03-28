import React, { useCallback, useReducer, useState } from "react";

import elementsReducer, {
  ADD_ASSETS,
  ADD_DEPENDENCIES,
  AREA_SELECTION,
  CLEAR_SELECTED,
  DISMISS_ERROR,
  FILTER_SELECTED_ELEMENTS,
  INITIAL_STATE,
  MULTI_SELECT_ELEMENTS,
  REMOVE_ELEMENTS_BY_TYPE,
  RESET,
  SELECT_ELEMENT,
  UPDATE_ERRORS,
} from "./elements-reducer";

export const ElementsContext = React.createContext();

export const ElementsProvider = ({ children }) => {
  const [selectedFloodAreas, setSelectedFloodAreas] = useState([]);
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

  const filterSelectedElements = useCallback(() => {
    dispatch({ type: FILTER_SELECTED_ELEMENTS });
  }, []);

  const addElements = useCallback(
    (assets, dependencies) => {
      if (!Array.isArray(assets) || !Array.isArray(dependencies)) return;
      dispatch({ type: ADD_ASSETS, assets });
      dispatch({ type: ADD_DEPENDENCIES, dependencies });
      filterSelectedElements();
    },
    [filterSelectedElements]
  );

  const removeElementsByType = useCallback(
    (typeUri) => {
      if (!typeUri) return;
      dispatch({ type: REMOVE_ELEMENTS_BY_TYPE, typeUri });
      filterSelectedElements();
    },
    [filterSelectedElements]
  );

  const reset = useCallback(() => {
    dispatch({ type: RESET });
  }, []);

  const onElementClick = useCallback((multiSelect, selectedElements) => {
    if (multiSelect) {
      dispatch({ type: MULTI_SELECT_ELEMENTS, selectedElements });
      return;
    }
    dispatch({ type: SELECT_ELEMENT, selectedElements });
  }, []);

  const onAreaSelect = useCallback((selectedElements) => {
    if (!Array.isArray(selectedElements)) return;
    dispatch({ type: AREA_SELECTION, selectedElements });
  }, []);

  const onFloodAreaSelect = useCallback((polygonUri) => {
    setSelectedFloodAreas(polygonUri);
  }, []);

  const updateErrorNotifications = useCallback((msg) => {
    dispatch({ type: UPDATE_ERRORS, error: msg });
  }, []);

  const dismissErrorNotification = (error) => {
    dispatch({ type: DISMISS_ERROR, error });
  };

  const clearSelectedElements = useCallback(() => {
    dispatch({ type: CLEAR_SELECTED });
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
        addElements,
        clearSelectedElements,
        dismissErrorNotification,
        filterSelectedElements,
        onAreaSelect,
        onElementClick,
        reset,
        removeElementsByType,
        updateErrorNotifications,
        selectedFloodAreas,
        onFloodAreaSelect,
      }}
    >
      {children}
    </ElementsContext.Provider>
  );
};
