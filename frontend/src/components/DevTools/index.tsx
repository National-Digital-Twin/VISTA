import React, { lazy, Suspense, memo } from "react";

export interface DevToolsProps {
  /** Whether the dev tools are enabled */
  readonly enabled: boolean;
  /** The wrapped app content */
  readonly children: React.ReactNode;
}

const DevToolsContainer = lazy(() => import("./DevToolsContainer"));

function DevTools({ enabled, children }: DevToolsProps) {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={<p>Loading dev tools...</p>}>
      <DevToolsContainer>{children}</DevToolsContainer>
    </Suspense>
  );
}

export default memo(DevTools);
