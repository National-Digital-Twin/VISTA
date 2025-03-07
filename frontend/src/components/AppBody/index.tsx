import classNames from "classnames";
import { Suspense, lazy } from "react";

const AppBodyLoadedContents = lazy(() => import("./AppBodyLoadedContents"));

export interface AppBodyProps {
  /** Additional classes to add to the top-level element */
  readonly className?: string;
}

/** Body of the Paralog app, everything below the header */
export default function AppBody({ className }: AppBodyProps) {
  return (
    <main className={classNames(className)}>
      <Suspense fallback={<p>Loading...</p>}>
        <AppBodyLoadedContents />
      </Suspense>
    </main>
  );
}
