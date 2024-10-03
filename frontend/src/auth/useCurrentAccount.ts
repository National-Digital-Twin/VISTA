import { useSyncExternalStore } from "react";
import type { AccountInfo } from "./provider";
import provider from "./provider";

/** Current authentication status */
export default function useCurrentAccount(): AccountInfo | null {
  return useSyncExternalStore(
    (onStoreChange) => {
      return provider.subscribe(onStoreChange);
    },
    () => {
      return provider.getCurrentAccount();
    },
  );
}
