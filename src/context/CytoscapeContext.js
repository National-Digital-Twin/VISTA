import { isEmpty } from "lodash";
import React, { createContext, useCallback, useRef } from "react";

import { useLocalStorage } from "hooks";
import { getUniqueElements } from "utils";

export const CytoscapeContext = createContext();

export const CytoscapeProvider = ({ children }) => {
  const cyRef = useRef({});
  const [layout, setLayout] = useLocalStorage("graphLayout", "cola");

  const moveTo = ({ areaSelect, cachedElements, selectedElements }) => {
    if (!cyRef.current) return;
    const padding = 20;
    const selected = areaSelect
      ? selectedElements
      : getUniqueElements([...cachedElements, ...selectedElements]);

    const elements = cyRef.current.elements().filter((element) => {
      return selected.some((selectedElement) => {
        const data = element.data("element");
        return selectedElement.uri === data.uri;
      });
    });

    fit(elements, padding);
  };

  const fit = (elements, padding) => {
    if (!cyRef.current) return;
    cyRef.current.fit(elements, padding);
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
      value={{ cyRef, layout, fit, moveTo, resize, runLayout, updateLayout }}
    >
      {children}
    </CytoscapeContext.Provider>
  );
};
