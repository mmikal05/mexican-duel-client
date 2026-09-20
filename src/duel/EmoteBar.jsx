import { useEffect, useState } from "react";
import { EMOTES } from "./constants";

// Quick reactions. The server only accepts these exact ones and allows about one per second.
export default function EmoteBar({ onEmote }) {
  const [cooling, setCooling] = useState(false);

  useEffect(() => {
    if (!cooling) return;
    const id = setTimeout(() => setCooling(false), 1000);
    return () => clearTimeout(id);
  }, [cooling]);

  const send = (emote) => {
    if (cooling) return;
    setCooling(true);
    onEmote(emote);
  };

  return (
    <div className={`emote-bar ${cooling ? "cooling" : ""}`} aria-label="Quick reactions">
      {EMOTES.map((emote) => (
        <button key={emote} className="emote-btn" onClick={() => send(emote)} disabled={cooling}>
          {emote}
        </button>
      ))}
    </div>
  );
}

// The bubble that pops up next to a player when they react.
export function EmoteBubble({ emote }) {
  if (!emote) return null;
  return (
    <span key={emote.id} className="emote-bubble" role="img" aria-label="reaction">
      {emote.emote}
    </span>
  );
}
