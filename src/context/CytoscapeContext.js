import { isEmpty } from "lodash";
import React, { createContext, useCallback, useRef, useState } from "react";

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

  const updateLayout = (layout) => {
    setLayout(layout);
  };

  const resize = () => {
    if (isEmpty(cyRef?.current)) return;
    cyRef.current.resize();
  };

  const runLayout = useCallback(() => {
    if (isEmpty(cyRef?.current) || cyRef.current?.destroyed()) return;
    const cylayout = cyRef.current.layout({ name: layout });
    cylayout.run();
  }, [cyRef, layout]);

  return (
    <CytoscapeContext.Provider
      value={{ cyRef, layout, clearSelected, resize, runLayout, updateLayout }}
    >
      {children}
    </CytoscapeContext.Provider>
  );
};
