import { useEffect, useRef } from 'react';

// One short buzz at the moment a session's time runs out while it's on
// screen — not when a view opens already over time (a reload, switching
// between the focus screen and the running bar). iPhones ignore
// navigator.vibrate from a web page; Android honours it.
let buzzedFor = null;

export function useOvertimeBuzz(overtime, taskId, beganAt) {
  const wasOvertime = useRef(overtime);
  useEffect(() => {
    const crossed = overtime && wasOvertime.current === false;
    wasOvertime.current = overtime;
    const key = taskId + ':' + beganAt;
    if (!crossed || !taskId || buzzedFor === key) return;
    buzzedFor = key;
    try { navigator.vibrate?.(250); } catch { /* not supported */ }
  }, [overtime, taskId, beganAt]);
}
