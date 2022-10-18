import React, { useEffect, useMemo, useRef, useState } from "react";

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

  const { assets, assetCriticalityColorScale, cxnCriticalityColorScale } = data;

  const filteredElems = useMemo(() => {
    return selectedElements.filter((elem) => assets.some((asset) => asset.id === elem.id));
  }, [assets, selectedElements]);

  useEffect(() => {
    if (assets.length === 0) {
      setSelectedElements([]);
      return;
    }
  }, [assets]);

  useEffect(() => {
    if (assets.length > 0) {
      const details = filteredElems.map((selectedElement) =>
        selectedElement.generateDetails(
          assets,
          assetCriticalityColorScale,
          cxnCriticalityColorScale
        )
      );
      setSelectedDetails(details);
      return;
    }
    setSelectedDetails([]);
  }, [assets, assetCriticalityColorScale, cxnCriticalityColorScale, filteredElems]);

  const onAssetSelect = (selected) => {
    setSelectedElements(selected);
  };

  return (
    <ElementsContext.Provider
      value={{
        cyRef,
        data,
        onAssetSelect,
        selectedElements: filteredElems,
        selectedDetails,
        setData,
      }}
    >
      {children}
    </ElementsContext.Provider>
  );
};
