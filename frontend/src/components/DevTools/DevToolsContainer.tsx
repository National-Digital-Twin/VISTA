import React from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export interface DevToolsContainerProps {
  /** Children */
  children: React.ReactNode;
}

export default function DevToolsContainer({
  children,
}: DevToolsContainerProps) {
  return (
    <>
      <React.StrictMode>{children}</React.StrictMode>
      <ReactQueryDevtools />
    </>
  );
}
