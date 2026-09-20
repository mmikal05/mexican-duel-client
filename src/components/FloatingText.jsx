import { useEffect, useRef } from "react";

// "+1 Wheat" style feedback that floats up from a point on screen, then removes itself.
export default function FloatingText({ text, x, y, onDone }) {
  const doneRef = useRef(onDone);

  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    const id = setTimeout(() => doneRef.current?.(), 900);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="floating-text" style={{ left: x, top: y }}>
      {text}
    </div>
  );
}
