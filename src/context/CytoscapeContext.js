import { isEmpty } from "lodash";
import React, { createContext, useCallback, useRef } from "react";

import { useLocalStorage } from "hooks";
import { getSelected } from "./elements-reducer";

export const CytoscapeContext = createContext();

export const CytoscapeProvider = ({ children }) => {
  const cyRef = useRef({});
  const [layout, setLayout] = useLocalStorage("graphLayout", "cola");

  const moveTo = ({
    areaSelect,
    multiSelect,
    cachedElements,
    selectedElement,
    selectedElements,
  }) => {
    if (!cyRef.current) return;
    const padding = areaSelect || multiSelect ? 20 : 200;
    let selected = [selectedElement];

    if (multiSelect) {
      selected = getSelected({ cachedElements, selectedElement });
    }

    if (areaSelect) {
      selected = selectedElements;
    }

    const nodes = cyRef.current.nodes().filter((element) => {
      return selected.some((selectedElement) => {
        const data = element.data("element")
        return selectedElement.id === data.id;
      });
    });
    fit(nodes, padding);
  };

  const fit = (nodes, padding) => {
    if (!cyRef.current) return;
    cyRef.current.fit(nodes, padding);
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
