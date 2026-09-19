import { useState } from "react";
import { useGame } from "../context/GameContext";
import useGameTick from "../hooks/useGameTick";
import { formatTime } from "../hooks/formatTime";
import FloatingText from "../components/FloatingText";

const SHED_DURATION = 10000;

export default function Shed() {
  const { inventory, setInventory, shedPlots, setShedPlots } = useGame();

  const [floatingTexts, setFloatingTexts] = useState([]);
  const [animIndex, setAnimIndex] = useState(null);

  useGameTick();

  const handleClick = (index, e) => {
    const plot = shedPlots[index];
    const rect = e.currentTarget.getBoundingClientRect();

    // empty stall: spend one feed to start producing
    if (!plot) {
      if (inventory.feed <= 0) return;

      const newPlots = [...shedPlots];
      newPlots[index] = { endTime: Date.now() + SHED_DURATION };

      setInventory((p) => ({ ...p, feed: p.feed - 1 }));
      setShedPlots(newPlots);
      return;
    }

    // finished: collect the leather
    if (Date.now() >= plot.endTime) {
      setAnimIndex(index);
      setTimeout(() => setAnimIndex(null), 300);

      setFloatingTexts((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "+1 Leather",
          x: rect.left + rect.width / 2,
          y: rect.top,
        },
      ]);

      const newPlots = [...shedPlots];
      newPlots[index] = null;

      setInventory((p) => ({ ...p, leather: p.leather + 1 }));
      setShedPlots(newPlots);
    }
  };

  return (
    <div>
      <div className="shed-grid">
        {shedPlots.map((plot, i) => {
          let status = "empty";
          let timeLeft = 0;

          if (plot) {
            timeLeft = plot.endTime - Date.now();
            // class names match shed.css (.empty / .processing / .ready)
            status = timeLeft > 0 ? "processing" : "ready";
          }

          return (
            <div
              key={i}
              className={`shed-tile ${status} ${
                animIndex === i ? "bounce" : ""
              }`}
              onClick={(e) => handleClick(i, e)}
            >
              <div className="shed-icon">
                {status === "empty" && "🐄"}
                {status === "processing" && "🥩"}
                {status === "ready" && "🧥"}
              </div>

              <div className="shed-status">
                {status === "empty" && "Feed"}
                {status === "processing" && formatTime(timeLeft)}
                {status === "ready" && "Collect"}
              </div>

              {status === "processing" && (
                <div className="shed-progress">
                  <div
                    className="shed-progress-fill"
                    style={{ width: `${100 - (timeLeft / SHED_DURATION) * 100}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {floatingTexts.map((ft) => (
        <FloatingText
          key={ft.id}
          {...ft}
          onDone={() => setFloatingTexts((p) => p.filter((t) => t.id !== ft.id))}
        />
      ))}
    </div>
  );
}
