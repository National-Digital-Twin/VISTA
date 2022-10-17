import React, { useEffect, useRef, useState } from "react";

export const ElementsContext = React.createContext();

export const ElementsProvider = ({ children }) => {
  const cyRef = useRef({});
  const [data, setData] = useState({
    assetCriticalityColorScale: {},
    assets: [],
    connections: [],
    cxnCriticalityColorScale: {},
    maxAssetCriticality: 0,
    maxAssetTotalCxns: 0,
    totalCxnsColorScale: {},
  });
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

  const onAssetSelect = (selected) => {
    setSelectedElements(selected);
  };

  return (
    <ElementsContext.Provider
      value={{
        cyRef,
        data,
        onAssetSelect,
        selectedElements,
        selectedDetails,
        setData,
      }}
    >
      {children}
    </ElementsContext.Provider>
  );
};
