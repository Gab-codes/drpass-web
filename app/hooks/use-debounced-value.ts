import { useEffect, useState } from "react";

/**
 * Returns a copy of `value` that only updates after `delayMs` of inactivity.
 * Useful for preventing API calls (e.g. search) from firing on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs = 700): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
