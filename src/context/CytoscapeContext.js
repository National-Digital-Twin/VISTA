import React, { createContext, useRef, useState } from "react";

export const CytoscapeContext = createContext();

export const CytoscapeProvider = ({ children }) => {
  const cyRef = useRef({});
  const [layout, setLayout] = useState("cola");

  const getSelected = () => {
    if (!cyRef.current) return;
    return cyRef.current.elements(":selected");
  };

  const clearSelected = () => {
    if (!cyRef.current) return;
    const selected = getSelected();
    selected.unselect();
  };

  const selectSelectedElements = (selectedElements) => {
    
  }

  const updateLayout = (layout) => {
    setLayout(layout);
  };

  return (
    <CytoscapeContext.Provider
      value={{ cyRef, layout, clearSelected, getSelected, updateLayout }}
    >
      {children}
    </CytoscapeContext.Provider>
  );
};
