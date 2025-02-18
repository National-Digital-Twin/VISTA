import React, { createContext, useCallback, useContext, useMemo } from "react";

interface ShowPointerCoords {
  /** Whether we are currently showing pointer coördinates */
  showPointerCoords: boolean;
  /** Set whether we should show pointer coordinates */
  setShowPointerCoords: (showPointerCoords: boolean) => void;
}

const ShowPointerCoordsContext = createContext<ShowPointerCoords>({
  showPointerCoords: false,
  setShowPointerCoords: () => {},
});

export function useShowPointerCoords(): boolean {
  return useContext(ShowPointerCoordsContext).showPointerCoords;
}

export function useSetShowPointerCoords(): (inDrawingMode: boolean) => void {
  return useContext(ShowPointerCoordsContext).setShowPointerCoords;
}

export function useTogglePointerCoords(): () => void {
  const showPointerCoords = useShowPointerCoords();
  const setShowPointerCoords = useSetShowPointerCoords();

  const togglePointerCoords = useCallback(() => {
    setShowPointerCoords(!showPointerCoords);
  }, [showPointerCoords, setShowPointerCoords]);

  return togglePointerCoords;
}

export interface ShowPointerCoordsContextProviderProps {
  /** Is currently showing pointer coördinates */
  readonly showPointerCoords: boolean;
  /** Set whether we are showing pointer coördinates */
  readonly setShowPointerCoords: (showPointerCoords: boolean) => void;
  /** Children */
  readonly children: React.ReactNode;
}

export function ShowPointerCoordsContextProvider({
  showPointerCoords,
  setShowPointerCoords,
  children,
}: ShowPointerCoordsContextProviderProps) {
  const contextValue: ShowPointerCoords = useMemo(
    () => ({
      showPointerCoords,
      setShowPointerCoords,
    }),
    [showPointerCoords, setShowPointerCoords],
  );

  return (
    <ShowPointerCoordsContext.Provider value={contextValue}>
      {children}
    </ShowPointerCoordsContext.Provider>
  );
}
