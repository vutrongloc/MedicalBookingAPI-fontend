import { useState, useCallback, useRef, useEffect } from "react";

export function useCooldown(delay = 3000) {
  const [locked, setLocked] = useState(false);
  const lockedRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const run = useCallback((fn) => {
    if (lockedRef.current) return false;
    lockedRef.current = true;
    setLocked(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      lockedRef.current = false;
      setLocked(false);
    }, delay);

    fn();
    return true;
  }, [delay]);

  return { isLocked: locked, run };
}
