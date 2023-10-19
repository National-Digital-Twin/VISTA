import { useFetch } from "use-http";
import config from "../config/app-config";
import { useCallback } from "react";

const useOntologyServer = (options) => {
  const { get, response, loading } = useFetch(config.api.ontology, {
    cachePolicy: "cache-first",
    persist: true,
    ...options,
  });

  const getIconStyle = useCallback(
    async (type) => {
      const queryParam = new URLSearchParams({ uri: type }).toString();
      const style = await get(`styles/class?${queryParam}`);
      if (response.ok) {
        const keys = Object.keys(style)
        return keys.length > 0 ? style[keys[0]] : undefined;
      }
    },
    [get, response]
  );

  return { getIconStyle, loading };
};

export default useOntologyServer;
