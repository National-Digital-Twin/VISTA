import { useCallback, useState } from "react";

const useJSFetch = () => {
  const [error, setError] = useState(undefined);
  const get = useCallback(async (url, options) => {
    setError(undefined);
    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
        ...options,
      });

      const data = await response.json();
      if (response.ok && response.status < 400) return data;

      throw new Error({
        status: response.status,
        statusText: response.statusText,
        message: data,
      });
    } catch (error) {
      if (error.name === "AbortError") return;
      console.log(error);
      setError(error);
    }
  }, []);

  return { error, get };
};

export default useJSFetch;
