import { useEffect, useState } from "react";

const getStoredValue = (key, defaultValue) => {
  try {
    const savedValue = localStorage.getItem(key);
    return JSON.parse(savedValue) || defaultValue;
  } catch (error) {
    console.error("Unable to get ", key, " from local storage");
    return defaultValue;
  }
};

const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => getStoredValue(key, defaultValue));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Unable to save ", value, " to local storage");
      return defaultValue;
    }
  }, [defaultValue, key, value]);

  return [value, setValue];
};

export default useLocalStorage;
