import React, { useContext, useEffect, useMemo, useReducer } from "react";
import { ElementsContext } from "../../context";
import { isEmpty } from "lodash";

import ElementDetails from "./SelectedDetails/ElementDetails";
import {
  LIST_VIEW,
  MULTIPLE_ITEMS,
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

  // useEffect(() => {
  //   if (selectedDetails.length === 1) {
  //     dispatch({ type: SINGLE_ELEMENT, index: 0, panelActions });
  //     return;
  //   }
  //   // dispatch({ type: LIST_VIEW });
  // }, [panelActions, selectedDetails]);

  // useEffect(() => {
  //   console.log({ header: state.header });
  //   // updateHeaderProps(state.header);
  // }, [state.header]);
  console.log({ header: state.header, index: state.index  });

  const handleMultiItemsView = (index) => {
    dispatch({
      type: MULTIPLE_ITEMS,
      index,
      onViewAll: () => {
        console.log("dispatch list view")
        dispatch({ type: LIST_VIEW });
      },
    });
  };

  if (isEmpty(selectedDetails)) {
    return <p>Click on an asset or dependacy to view it's details</p>;
  }

  return (
    <>
      {state.index > -1 ? (
        <ElementDetails expand element={selectedDetails[state.index]} />
      ) : (
        <ul className="flex flex-col gap-y-3">
          {selectedDetails.map((selectedElement, index) => (
            <ElementDetails
              key={selectedElement.uri}
              element={selectedElement}
              onViewDetails={() => handleMultiItemsView(index)}
            />
          ))}
        </ul>
      )}
    </>
  );
};

export default SelectedElements;
