import React, { createContext, useRef, useState } from "react";

export const CytoscapeContext = createContext();

export const CytoscapeProvider = ({ children }) => {
  const cyRef = useRef({});
  const [layout, setLayout] = useState("cola");

  const getSelected = () => {
    if (!cyRef.current) return;
    return cyRef.current.elements(":selected");
  };

  const getSelectedElements = () => {
    if (!cyRef.current) return;
    const selected = getSelected();
    return selected.map((node) => node.data("element"));
  };

  const clearSelected = () => {
    if (!cyRef.current) return;
    const selected = getSelected();
    selected.unselect();
  };

  const updateLayout = (layout) => {
    setLayout(layout);
  };

  return (
    <CytoscapeContext.Provider
      value={{ cyRef, layout, clearSelected, getSelectedElements, updateLayout }}
    >
      {children}
    </CytoscapeContext.Provider>
  );
};
