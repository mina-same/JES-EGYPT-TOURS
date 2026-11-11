import { useEffect, useState } from 'react';

/**
 * `value`, once it has stopped changing for `delayMs`.
 *
 * For search boxes that query the API: the input stays on the live value and
 * the request reads this one, so typing a word sends one request instead of
 * one per keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
