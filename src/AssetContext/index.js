import React, { createContext } from "react";

export const AssetContext = createContext();

const initial_state = {
  type: undefined,
  selected: {},
};

const AssetProvider = ({ children }) => {
  const [nodeState, setNodeState] = React.useState(initial_state);
  const onSelectedNode = async (node, type) => {
    setNodeState({ type, selected: node });
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
