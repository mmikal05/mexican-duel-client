import { useEffect, useState } from "react";

// Whole seconds left until `endAt` (a Date.now() timestamp), or null when there is no timer.
export default function useCountdown(endAt) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!endAt) return;
    const id = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, [endAt]);

  return endAt ? Math.max(0, Math.ceil((endAt - Date.now()) / 1000)) : null;
}
