import React, { createContext, useContext, useState } from "react";

type TooltipData = {
  center: [number, number];
  area: number;
};

type TooltipContextType = {
  tooltips: Record<string, TooltipData>;
  setTooltip: (id: string, data: TooltipData) => void;
  removeTooltip: (id: NonNullable<string | number | undefined>) => void;
};

const TooltipContext = createContext<TooltipContextType | null>(null);

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tooltips, setTooltips] = useState<Record<string, TooltipData>>({});

  const setTooltip = (id: string, data: TooltipData) => {
    setTooltips((prev) => ({ ...prev, [id]: data }));
  };

  const removeTooltip = (id: NonNullable<string | number | undefined>) => {
    setTooltips((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  return (
    <TooltipContext.Provider value={{ tooltips, setTooltip, removeTooltip }}>
      {children}
    </TooltipContext.Provider>
  );
};

export const useTooltips = () => {
  const ctx = useContext(TooltipContext);
  if (!ctx) {
    throw new Error("useTooltips must be used within TooltipProvider");
  }
  return ctx;
};
