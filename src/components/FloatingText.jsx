import { useEffect, useState } from "react";

export default function FloatingText({ text, x, y, onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setVisible(false);
      onDone();
    }, 800);

    return () => clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="floating-text"
      style={{
        left: x,
        top: y
      }}
    >
      {text}
    </div>
  );
}