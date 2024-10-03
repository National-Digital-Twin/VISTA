import type { Dispatch } from "react";
import { useEffect, useState } from "react";

function getStoredValue<T>(key: string, defaultValue: T) {
  try {
    const savedValue = localStorage.getItem(key);
    return (JSON.parse(savedValue) as T) || defaultValue;
  } catch {
    return defaultValue;
  }
}

export default function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (action: T | Dispatch<T>) => void] {
  const [value, setValue] = useState(() => getStoredValue(key, defaultValue));

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
