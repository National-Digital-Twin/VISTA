import type { Dispatch } from 'react';
import React, { useEffect, useState } from 'react';

function getStoredValue<T>(key: string, defaultValue: T) {
    try {
        const savedValue = localStorage.getItem(key);
        return savedValue ? (JSON.parse(savedValue) as T) || defaultValue : defaultValue;
    } catch {
        return defaultValue;
    }
}

export default function useLocalStorage<T>(key: string, defaultValue: T): [T, Dispatch<React.SetStateAction<T>>] {
    const [value, setValue] = useState(() => getStoredValue(key, defaultValue));

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
}
