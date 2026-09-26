import { useEffect, useState } from 'react';

// The current time, re-rendering once a second while `ticking`.
export function useNow(ticking) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!ticking) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [ticking]);
  return now;
}
