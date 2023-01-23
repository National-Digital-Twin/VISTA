import React, { useEffect, useReducer } from "react";
import { isEmpty } from "lodash";

import ElementDetails from "./ElementDetails";
import {
  LIST_VIEW,
  MULTIPLE_ITEMS,
  NOTHING_SELECTED,
  RESET_STATE,
  selectedElementsReducer,
  SELECTED_ELEMENTS_INITIAL_STATE,
  SINGLE_ELEMENT,
} from "./selected-elements-reducer";
import SelectedElementsHeader from "./SelectedElementsHeader";

const SelectedElements = ({ selectedElements, onTogglePanel }) => {
  const [state, dispatch] = useReducer(selectedElementsReducer, SELECTED_ELEMENTS_INITIAL_STATE);
  const { index, view, header } = state;

  useEffect(() => {
    if (isEmpty(selectedElements)) {
      dispatch({ type: RESET_STATE });
      return;
    }

    if (selectedElements.length === 1) {
      dispatch({ type: SINGLE_ELEMENT });
      return;
    }

    if (selectedElements.length > 1) {
      dispatch({ type: LIST_VIEW });
      return;
    }
  }, [selectedElements]);

  const handleOnViewDetails = (index) => {
    dispatch({
      type: MULTIPLE_ITEMS,
      index,
      onViewAll: () => dispatch({ type: LIST_VIEW }),
    });
  };

  const VIEWS = {
    [NOTHING_SELECTED]: () => <p>Click on an asset or connection to view details</p>,
    [SINGLE_ELEMENT]: () => {
      const selected = index ? selectedElements[index] : selectedElements[0];
      return <ElementDetails expand element={selected} />;
    },
    [LIST_VIEW]: () => (
      <ul className="gap-y-3 grow min-h-0 overflow-y-auto">
        {selectedElements.map((selectedElement, index) => (
          <ElementDetails
            key={selectedElement.id}
            element={selectedElement}
            onViewDetails={() => handleOnViewDetails(index)}
          />
        ))}
      </ul>
    ),
  };

  const renderView = () => {
    const component = VIEWS[view]
    return component();
  }

  return <>
    <SelectedElementsHeader onToggle={onTogglePanel} {...header} />
    {renderView()}
  </>
};

export default SelectedElements;
