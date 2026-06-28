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

    if (!plot) {
      if (inventory.feed <= 0) return;

      const newPlots = [...shedPlots];
      newPlots[index] = { endTime: Date.now() + SHED_DURATION };

      setInventory(p => ({ ...p, feed: p.feed - 1 }));
      setShedPlots(newPlots);
      return;
    }

    if (Date.now() >= plot.endTime) {
      setAnimIndex(index);
      setTimeout(() => setAnimIndex(null), 300);

      setFloatingTexts(prev => [
        ...prev,
        {
          id: Date.now(),
          text: "+1 Leather",
          x: rect.left + rect.width / 2,
          y: rect.top
        }
      ]);

      const newPlots = [...shedPlots];
      newPlots[index] = null;

      setInventory(p => ({
        ...p,
        leather: p.leather + 1
      }));

      setShedPlots(newPlots);
    }
  };

  return (
    <div>
      <div className="shed-grid">
        {shedPlots.map((plot, i) => {
          let status = "cow";
          let timeLeft = 0;

          if (plot) {
            timeLeft = plot.endTime - Date.now();
            status = timeLeft > 0 ? "producing" : "ready";
          }

          return (
            <div
              key={i}
              className={`cow clickable ${status} ${
                animIndex === i ? "bounce" : ""
              }`}
              onClick={(e) => handleClick(i, e)}
            >
              <div>{status}</div>
              {status === "producing" && <div>{formatTime(timeLeft)}</div>}
              {status === "ready" && <div>🧥</div>}
              {status === "cow" && <div>🐄</div>}
            </div>
          );
        })}
      </div>

      {floatingTexts.map(ft => (
        <FloatingText key={ft.id} {...ft}
          onDone={() =>
            setFloatingTexts(p => p.filter(t => t.id !== ft.id))
          }
        />
      ))}
    </div>
  );
}