import { create } from "zustand";

import { persist, createJSONStorage } from "zustand/middleware";
import type { UseBoundStore, StateCreator } from "zustand";
import type { StateStorage, PersistOptions } from "zustand/middleware";

let shouldHandlePopState = true;
const allStores: UseBoundStore<any>[] = [];

const handlePopState = (event: PopStateEvent) => {
  // A proxy for whether it could be a back/forward event:
  const explicitOriginalTarget = (event as any).explicitOriginalTarget; // This is a non-standard API
  const eventOriginatesFromWindow = explicitOriginalTarget === window;
  if (eventOriginatesFromWindow && shouldHandlePopState) {
    allStores.forEach((store) => {
      store.persist.rehydrate();
    });
  }
};

export const resetHashStorage = () => {
  allStores.forEach((store) => {
    store.setState(store.getInitialState());
  });
  window.location.hash = "";
};

const hashStorage: StateStorage = {
  getItem: (key) => {
    const searchParams = new URLSearchParams(window.location.hash.slice(1));
    return searchParams.get(key) ?? "";
  },
  setItem: (key, newValue) => {
    const searchParams = new URLSearchParams(window.location.hash.slice(1));
    searchParams.set(key, newValue);
    shouldHandlePopState = false;
    window.location.hash = searchParams.toString();
    shouldHandlePopState = true;
  },
  removeItem: (key) => {
    const searchParams = new URLSearchParams(window.location.hash.slice(1));
    searchParams.delete(key);
    shouldHandlePopState = false;
    window.location.hash = searchParams.toString();
    shouldHandlePopState = true;
  },
};

export default function createStore<T>(name: string, creator: StateCreator<T>) {
  const persistOptions: PersistOptions<T> = {
    name: name,
    storage: createJSONStorage(() => hashStorage),
  };

  const useStore = create<T>()(persist(creator, persistOptions));
  allStores.push(useStore);
  return useStore;
}

window.addEventListener("popstate", handlePopState);
