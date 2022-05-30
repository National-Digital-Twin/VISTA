import React, { createContext, useReducer, useState } from "react";

export const AssetContext = createContext();

const SET_SELECTED_NODE = "SET_SELECTED_NODE";
const initial_state = {
  type: undefined,
  selected: {},
};

const reducer = (state = initial_state, action) => {
  switch (action.type) {
    case SET_SELECTED_NODE:
      return {
        ...state,
        type: action.data.type,
        selected: action.data.selected,
      };

    default:
      return state;
  }
};

const AssetProvider = ({ children }) => {
  const [nodeState, dispatch] = useReducer(reducer, initial_state);

  const onSelectedNode = (node, type) => {
    dispatch({ type: SET_SELECTED_NODE, data: { type, selected: node } });
  };

  return (
    <AssetContext.Provider
      value={{
        selected: nodeState.selected,
        type: nodeState.type,
        onSelectedNode,
      }}
    >
      {children}
    </AssetContext.Provider>
  );
};

export default AssetProvider;
