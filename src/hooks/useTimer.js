import { useEffect, useState } from "react";
import { getRemainingTime } from "../systems/timerSystem";

export default function useTimer(key) {
  const [timeLeft, setTimeLeft] = useState(getRemainingTime(key));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getRemainingTime(key));
    }, 1000);

    return () => clearInterval(interval);
  }, [key]);

  return timeLeft;
}