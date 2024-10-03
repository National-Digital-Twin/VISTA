import React, { createContext, useContext, useMemo } from "react";

interface MapStyle {
  /** Key of the currently selected map style */
  mapStyleKey: string;
  /** Set which style of map we're wanting to use */
  setMapStyleKey: (mapStyleKey: string) => void;
}

const MapStyleContext = createContext<MapStyle>({
  mapStyleKey: "",
  setMapStyleKey: () => undefined,
});

export function useMapStyleKey(): string {
  return useContext(MapStyleContext).mapStyleKey;
}

export function useSetMapStyleKey(): (mapStyleKey: string) => void {
  return useContext(MapStyleContext).setMapStyleKey;
}

export interface MapStyleContextProviderProps {
  /** Currently selected map style */
  mapStyleKey: string;
  /** Set a new map style */
  setMapStyleKey: (mapStyleKey: string) => void;
  /** Children */
  children: React.ReactNode;
}

export function MapStyleContextProvider({
  mapStyleKey,
  setMapStyleKey,
  children,
}: MapStyleContextProviderProps) {
  const contextValue: MapStyle = useMemo(
    () => ({
      mapStyleKey,
      setMapStyleKey,
    }),
    [mapStyleKey, setMapStyleKey],
  );

  return (
    <MapStyleContext.Provider value={contextValue}>
      {children}
    </MapStyleContext.Provider>
  );
}
