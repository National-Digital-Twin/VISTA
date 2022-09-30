import React, { useState } from "react";

export const ElementsContext = React.createContext();

const ElementsProvider = ({ children }) => {
  const [elements, updateElements] = useState({
    assets: [],
    connections: [],
  });
  const [graphLayout, setGraphLayout] = useState("cola");

  const updateGraphLayout = (layout) => {
    setGraphLayout(layout);
  };

  return (
    <ElementsContext.Provider value={{ elements, graphLayout, updateElements, updateGraphLayout }}>
      {children}
    </ElementsContext.Provider>
  );
};

export default ElementsProvider;
