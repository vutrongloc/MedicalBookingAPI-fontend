import { useState, useCallback, useRef, useEffect } from "react";

export function useCooldown(delay = 3000) {
  const [locked, setLocked] = useState(false);
  const timerRef = useRef(null);
  const lockedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const run = useCallback((fn) => {
    if (lockedRef.current) return false;
    lockedRef.current = true;
    setLocked(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      lockedRef.current = false;
      setLocked(false);
    }, delay);

    fn();
    return true;
  }, [locked, delay]);

  return { isLocked: locked, run };
}

export default function CooldownButton({
  delay = 3000,
  onClick,
  disabled,
  children,
  lockedLabel,
  type = "button",
  ...rest
}) {
  const [locked, setLocked] = useState(false);
  const timerRef = useRef(null);
  const lockedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = (e) => {
    if (!onClick || disabled || lockedRef.current) return;

    lockedRef.current = true;
    setLocked(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      lockedRef.current = false;
      setLocked(false);
    }, delay);

    onClick(e);
  };

  return (
    <button {...rest} type={type} disabled={disabled || locked} onClick={handleClick}>
      {locked && lockedLabel != null ? lockedLabel : children}
    </button>
  );
}
