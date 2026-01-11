import * as React from 'react';
import SecureLS from 'secure-ls';

type UseLocalStorageOptions<T> = {
    serializer?: (value: T) => string;
    deserializer?: (value: string) => T;
    initializeWithValue?: boolean;
    secureOptions?: ConstructorParameters<typeof SecureLS>[0];
};

const IS_SERVER = typeof window === 'undefined';

// Create a singleton SecureLS instance (this is safe, SecureLS is stateless regarding keys)
function getLS(options?: ConstructorParameters<typeof SecureLS>[0]) {
    // We'll memoize one instance for the session
    if (typeof window === 'undefined') return null as any;
    if (!(window as any).__secureLS) {
        (window as any).__secureLS = new SecureLS(options);
    }
    return (window as any).__secureLS as SecureLS;
}

export function useLocalStorage<T>(
    key: string,
    initialValue: T | (() => T),
    options: UseLocalStorageOptions<T> = {}
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
    const { initializeWithValue = true, secureOptions } = options;

    // secure-ls does not allow custom serialization, so we still support custom serializer for flexibility,
    // but allow SecureLS to handle encoding/decoding by default
    const serializer = React.useCallback(
        (value: T): string => {
            if (options.serializer) {
                return options.serializer(value);
            }
            return JSON.stringify(value);
        },
        [options]
    );

    const deserializer = React.useCallback(
        (value: string): T => {
            if (options.deserializer) {
                return options.deserializer(value);
            }
            if (value === 'undefined') {
                return undefined as unknown as T;
            }
            const defaultValue = initialValue instanceof Function ? initialValue() : initialValue;
            try {
                return JSON.parse(value) as T;
            } catch {
                return defaultValue;
            }
        },
        [options, initialValue]
    );

    // Use secure-ls for all storage interactions
    const readValue = React.useCallback((): T => {
        const initialValueToUse = initialValue instanceof Function ? initialValue() : initialValue;

        if (IS_SERVER) {
            return initialValueToUse;
        }

        try {
            const ls = getLS(secureOptions);
            const raw = ls.get(key);
            // SecureLS returns null if key doesn't exist
            return raw !== null && raw !== undefined
                ? options.deserializer
                    ? deserializer(raw)
                    : raw
                : initialValueToUse;
        } catch {
            return initialValueToUse;
        }
    }, [initialValue, key, deserializer, options.deserializer, secureOptions]);

    const [storedValue, setStoredValue] = React.useState<T>(() => {
        if (initializeWithValue) {
            return readValue();
        }
        return initialValue instanceof Function ? initialValue() : initialValue;
    });

    const setValue: React.Dispatch<React.SetStateAction<T>> = React.useCallback(
        (value) => {
            if (IS_SERVER) {
                return;
            }

            try {
                const newValue = value instanceof Function ? value(readValue()) : value;

                const ls = getLS(secureOptions);
                const data = options.serializer ? serializer(newValue) : newValue;
                ls.set(key, data);
                setStoredValue(newValue);
                // still send custom event for cross component notification (not handled by secure-ls)
                window.dispatchEvent(new StorageEvent('local-storage', { key }));
            } catch (error) {
                console.warn(`Error setting SecureLS key "${key}":`, error);
            }
        },
        [key, serializer, readValue, options.serializer, secureOptions]
    );

    const removeValue = React.useCallback(() => {
        if (IS_SERVER) {
            return;
        }

        const defaultValue = initialValue instanceof Function ? initialValue() : initialValue;

        try {
            const ls = getLS(secureOptions);
            ls.remove(key);
            setStoredValue(defaultValue);
            window.dispatchEvent(new StorageEvent('local-storage', { key }));
        } catch (error) {
            // defensive: sometimes storage quota errors
            setStoredValue(defaultValue);
        }
    }, [key, initialValue, secureOptions]);

    React.useEffect(() => {
        setStoredValue(readValue());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key /* don't rerun on readValue itself, only on key change */]);

    React.useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key && event.key !== key) {
                return;
            }
            setStoredValue(readValue());
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('local-storage' as any, handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('local-storage' as any, handleStorageChange);
        };
    }, [key, readValue]);

    return [storedValue, setValue, removeValue];
}

export type { UseLocalStorageOptions };
