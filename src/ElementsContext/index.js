import React, { useEffect, useState } from "react";

export const ElementsContext = React.createContext();

const ElementsProvider = ({ children }) => {
  const [data, setData] = useState({
    assetCriticalityColorScale: {},
    assets: [],
    connections: [],
    cxnCriticalityColorScale: {},
    maxAssetCriticality: 0,
    maxAssetTotalCxns: 0,
    totalCxnsColorScale: {},
  });
  const [graphLayout, setGraphLayout] = useState("cola");
  const [selectedElements, setSelectedElements] = useState([]);
  const [selectedDetails, setSelectedDetails] = useState([]);

  const {assets, assetCriticalityColorScale, cxnCriticalityColorScale} = data

  useEffect(() => {
    if (assets.length > 0) {
      const details = selectedElements.map((selectedElement) =>
        selectedElement.generateDetails(assets, assetCriticalityColorScale, cxnCriticalityColorScale)
      );
      setSelectedDetails(details);
      return;
    }
    setSelectedDetails([])
  }, [assets, assetCriticalityColorScale, cxnCriticalityColorScale, selectedElements]);

  const updateGraphLayout = (layout) => {
    setGraphLayout(layout);
  };

  const onAssetSelect = (selected) => {
    setSelectedElements(selected);
  };

  return (
    <ElementsContext.Provider
      value={{
        data,
        graphLayout,
        onAssetSelect,
        selectedElements,
        selectedDetails,
        setData,
        updateGraphLayout,
      }}
    >
      {children}
    </ElementsContext.Provider>
  );
};

export default ElementsProvider;
