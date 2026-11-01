import { useState, useEffect } from 'react';

/**
 * Menunda pembaruan nilai state hingga pengguna berhenti mengetik selama `delayMs` milidetik.
 * Menjaga input teks tetap responsif (0 lag) sembari mencegah kalkulasi filter/pencarian
 * ribuan baris atau pemanggilan API berulang pada setiap ketukan huruf.
 */
export function useDebounce<T>(value: T, delayMs = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

