import { useEffect } from 'react';

export function useAutoPrint(ready, delay = 400) {
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => window.print(), delay);
    return () => clearTimeout(t);
  }, [ready, delay]);
}
