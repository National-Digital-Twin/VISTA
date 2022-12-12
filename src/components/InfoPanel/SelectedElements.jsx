import React, { useEffect, useReducer } from "react";
import { isEmpty } from "lodash";

import ElementDetails from "./ElementDetails";
import {
  LIST_VIEW,
  MULTIPLE_ITEMS,
  RESET_STATE,
  selectedElementsReducer,
  SELECTED_ELEMENTS_INITIAL_STATE,
  SINGLE_ELEMENT,
} from "./selected-elements-reducer";

const SelectedElements = ({ selectedElements, updateHeaderProps }) => {
  const [state, dispatch] = useReducer(selectedElementsReducer, SELECTED_ELEMENTS_INITIAL_STATE);
  const { index, header } = state;

  useEffect(() => {
    if (selectedElements.length === 1) {
      dispatch({ type: SINGLE_ELEMENT, index: 0 });
    }
    else if (selectedElements.length > 1) {
      dispatch({ type: LIST_VIEW });
    }
    else {
      dispatch({ type: RESET_STATE });
    }
  }, [selectedElements]);

  useEffect(() => {
    updateHeaderProps({
      ...header,
      latitude: selectedElements[index]?.lat,
      longitude: selectedElements[index]?.lng,
    });
  }, [header, selectedElements, index, updateHeaderProps]);

  console.log(selectedElements)

  const handleOnViewDetails = (index) => {
    dispatch({
      type: MULTIPLE_ITEMS,
      index,
      onViewAll: () => dispatch({ type: LIST_VIEW }),
    });
  };

  if (isEmpty(selectedElements)) {
    return <p>Click on an asset or connection to view details</p>;
  }

  if (index > -1) {
    const selectedElement = selectedElements[index];
    return <ElementDetails expand element={selectedElement} />;
  }

  return (
    <ul className="gap-y-3 grow min-h-0 overflow-y-auto">
      {selectedElements.map((selectedElement, index) => (
        <ElementDetails
          key={selectedElement.id}
          element={selectedElement}
          onViewDetails={() => handleOnViewDetails(index)}
        />
      ))}
    </ul>
  );
};

export default SelectedElements;
