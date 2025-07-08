import React, { createContext, useContext } from "react";
import useDynamicProximity from "./useDynamicProximity";

interface DynamicProximityDrawingContextValue {
  startDrawingWithRange: (radiusKm: number) => void;
}

const DynamicProximityDrawingContext =
  createContext<DynamicProximityDrawingContextValue | null>(null);

export function useDynamicProximityDrawingContext() {
  const context = useContext(DynamicProximityDrawingContext);
  if (!context) {
    throw new Error(
      "useDynamicProximityDrawingContext must be used within DynamicProximityProvider",
    );
  }
  return context;
}

export default function DynamicProximityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { startDrawingWithRange } = useDynamicProximity();

  const contextValue = { startDrawingWithRange };

  return (
    <DynamicProximityDrawingContext.Provider value={contextValue}>
      {children}
    </DynamicProximityDrawingContext.Provider>
  );
}
