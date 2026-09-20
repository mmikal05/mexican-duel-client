import { useSyncExternalStore } from "react";

// A tiny shared flag: true while the player is in the middle of a duel, so the
// rest of the app (the bottom nav) can stop them wandering off by accident.
let locked = false;
const listeners = new Set();

export function setMatchLocked(value) {
  if (locked === value) return;
  locked = value;
  listeners.forEach((l) => l());
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useMatchLocked = () => useSyncExternalStore(subscribe, () => locked);
