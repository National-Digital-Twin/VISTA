import React, { useContext, useEffect, useReducer } from "react";
import { ElementsContext } from "../../context";
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

const getStreetViewLink = (element) => {
  if (!element?.lat && !element?.lng) return undefined;

  const params = {
    api: 1,
    map_action: "pano",
    viewpoint: `${element.lat},${element.lng}`,
  };
  return `https://www.google.com/maps/@?${new URLSearchParams(params).toString()}`;
};

const SelectedElements = ({ updateHeaderProps }) => {
  const { selectedDetails } = useContext(ElementsContext);
  const [state, dispatch] = useReducer(selectedElementsReducer, SELECTED_ELEMENTS_INITIAL_STATE);

  // const panelActions = useMemo(
  //   () => [
  //     {
  //       label: "street view",
  //       type: "link",
  //       href: getStreetViewLink("#alecs"),
  //     },
  //   ],
  //   []
  // );

  useEffect(() => {
    if (selectedDetails.length === 1) {
      dispatch({ type: SINGLE_ELEMENT, index: 0 });
      return;
    }
    if (selectedDetails.length > 0) {
      dispatch({ type: LIST_VIEW });
      return;
    }
    dispatch({ type: RESET_STATE });
  }, [selectedDetails]);

  useEffect(() => {
    updateHeaderProps(state.header);
  }, [state.header, updateHeaderProps]);

  const handleOnViewDetails = (index) => {
    dispatch({
      type: MULTIPLE_ITEMS,
      index,
      onViewAll: () => dispatch({ type: LIST_VIEW }),
    });
  };

  if (isEmpty(selectedDetails)) {
    return <p>Click on an asset or dependacy to view it's details</p>;
  }

  if (state.index > -1) {
    return <ElementDetails expand element={selectedDetails[state.index]} />;
  }

  return (
    <ul className="flex flex-col gap-y-3">
      {selectedDetails.map((selectedElement, index) => (
        <ElementDetails
          key={selectedElement.uri}
          element={selectedElement}
          onViewDetails={() => handleOnViewDetails(index)}
        />
      ))}
    </ul>
  );
};

export default SelectedElements;
