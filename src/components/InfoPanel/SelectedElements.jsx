import React, { useEffect, useMemo, useReducer } from "react";
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

const SelectedElements = ({ getDetails, selectedElements, updateHeaderProps }) => {
  const [state, dispatch] = useReducer(selectedElementsReducer, SELECTED_ELEMENTS_INITIAL_STATE);
  const { index, header } = state;

  // const selectedElement = useMemo(() => selectedElements[index], [selectedElements, index]);

  useEffect(() => {
    // if (index === 0) return;
    if (selectedElements.length === 1) {
      dispatch({ type: SINGLE_ELEMENT, index: 0 });
      return;
    }
    if (selectedElements.length > 0) {
      dispatch({ type: LIST_VIEW });
      return;
    }
    if (isEmpty(selectedElements)) {
      dispatch({ type: RESET_STATE });
      return;
    }
  }, [selectedElements]);

  // useEffect(() => {
  //   updateHeaderProps({
  //     ...header,
  //     latitude: selectedElement?.lat,
  //     longitude: selectedElement?.lng,
  //   });
  // }, [header, selectedElement, updateHeaderProps]);

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
    console.log("here");
    const selectedElement = selectedElements[index];
    // return <div className="break-words">{JSON.stringify(selectedElement)}</div>
    return <ElementDetails expand element={selectedElement} />;
  }

  return (
    <ul className="gap-y-3 grow min-h-0 overflow-y-auto">
      {selectedElements.map((selectedElement, index) => (
        <div className="break-words">{JSON.stringify(selectedElement)}</div>
        // <ElementDetails
        //   key={selectedElement.id}
        //   element={getDetails(selectedElement)}
        //   onViewDetails={() => handleOnViewDetails(index)}
        // />
      ))}
    </ul>
  );
};

export default SelectedElements;
