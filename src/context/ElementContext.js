import React, { useCallback, useEffect, useRef, useState } from "react";
import { isAsset } from "../utils";

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
  const [error, setError] = useState(undefined);

  const {assets, connections, assetCriticalityColorScale, cxnCriticalityColorScale} = data

  useEffect(() => {
    if (assets.length > 0) {
      const safeElements = selectedElements.filter(elem => {
        if (isAsset(elem)) {
          return assets.some(asset => asset.id === elem.id)
        }
        return connections.some(cxn => cxn.id === elem.id)
      })
      if(safeElements.length === 0 ){
        setSelectedDetails([])
        return 
      }
      const details = safeElements.map((selectedElement) =>
        selectedElement.generateDetails(assets, assetCriticalityColorScale, cxnCriticalityColorScale)
      );
      setSelectedDetails(details);
      return;
    }
    setSelectedDetails([])
  }, [assets, connections, selectedElements, assetCriticalityColorScale, cxnCriticalityColorScale]);

  const onAssetSelect = (selected) => {
    setSelectedElements(selected);
  };

  const setNotificationError = useCallback((msg) => {
    setError(msg);
  }, []);

  return (
    <ElementsContext.Provider
      value={{
        cyRef,
        data,
        error,
        onAssetSelect,
        selectedElements,
        selectedDetails,
        setData,
        setNotificationError
      }}
    >
      {children}
    </ElementsContext.Provider>
  );
};
