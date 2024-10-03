import classNames from "classnames";
import { Suspense, lazy } from "react";
import styles from "./style.module.css";
import AuthPrompt from "@/components/AuthPrompt";
import useAuthenticate from "@/auth/useAuthenticate";

const AppBodyLoadedContents = lazy(() => import("./AppBodyLoadedContents"));

export interface AppBodyProps {
  /** Additional classes to add to the top-level element */
  className?: string;
}

/** Body of the Paralog app, everything below the header */
export default function AppBody({ className }: AppBodyProps) {
  return (
    <main className={classNames(styles.appBody, className)}>
      <AppBodyContents />
    </main>
  );
}

function AppBodyContents() {
  const auth = useAuthenticate();

  switch (auth.status) {
    case "logged-in":
      return (
        <Suspense fallback={<p>Loading...</p>}>
          <AppBodyLoadedContents />
        </Suspense>
      );
    case "logging-in":
      return <AuthPrompt />;
    case "logged-out":
      return <AuthPrompt onLogIn={auth.onLogIn} error={auth.error} />;
    default:
      throw new Error("Unknown authentication status");
  }
}
