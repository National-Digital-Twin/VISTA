import React, { useState } from "react";

export const ElementsContext = React.createContext();

const ElementsProvider = ({ children }) => {
  const [elements, updateElements] = useState({
    assets: [],
    connections: [],
  });

  return (
    <ElementsContext.Provider value={{ updateElements, elements }}>
      {children}
    </ElementsContext.Provider>
  );
};

export default ElementsProvider;
