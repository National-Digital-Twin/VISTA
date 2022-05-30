import React, { createContext, useState } from "react";

export const AssetContext = createContext();

const AssetProvider = ({ children }) => {
  const [type, setType] = useState(undefined);
  const [selected, setSelected] = useState({});
  const onSelectedNode = (node, type) => {
    setSelected(node);
    setType(type);
  };

  return (
    <AssetContext.Provider value={{ selected, type, onSelectedNode }}>
      {children}
    </AssetContext.Provider>
  );
};

export default AssetProvider;
