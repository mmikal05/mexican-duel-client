import { useState } from "react";
import { useGame } from "../context/GameContext";
import useGameTick from "../hooks/useGameTick";
import { formatTime } from "../hooks/formatTime";
import FloatingText from "../components/FloatingText";

const FARM_DURATION = 10000;

export default function Farm() {
  const { inventory, setInventory, farmPlots, setFarmPlots } = useGame();

  const [floatingTexts, setFloatingTexts] = useState([]);
  const [animIndex, setAnimIndex] = useState(null);

  useGameTick();

  const handleClick = (index, e) => {
    const plot = farmPlots[index];

    const rect = e.currentTarget.getBoundingClientRect();

    if (!plot) {
      if (inventory.seeds <= 0) return;

      const newPlots = [...farmPlots];
      newPlots[index] = { endTime: Date.now() + FARM_DURATION };

      setInventory(p => ({ ...p, seeds: p.seeds - 1 }));
      setFarmPlots(newPlots);
      return;
    }

    if (Date.now() >= plot.endTime) {
      setAnimIndex(index);
      setTimeout(() => setAnimIndex(null), 300);

      setFloatingTexts(prev => [
        ...prev,
        {
          id: Date.now(),
          text: "+1 Wheat",
          x: rect.left + rect.width / 2,
          y: rect.top
        }
      ]);

      const newPlots = [...farmPlots];
      newPlots[index] = null;

      setInventory(p => ({ ...p, wheat: p.wheat + 1 }));
      setFarmPlots(newPlots);
    }
  };

  return (
    <div>
      <div className="farm-grid">
        {farmPlots.map((plot, i) => {
          let status = "empty";
          let timeLeft = 0;

          if (plot) {
            timeLeft = plot.endTime - Date.now();
            status = timeLeft > 0 ? "growing" : "ready";
          }

          return (
            <div
              key={i}
              className={`plot clickable ${status} ${
                animIndex === i ? "pop" : ""
              }`}
              onClick={(e) => handleClick(i, e)}
            >
              <div>{status}</div>
              {status === "growing" && <div>{formatTime(timeLeft)}</div>}
              {status === "ready" && <div>🌾</div>}
            </div>
          );
        })}
      </div>

      {floatingTexts.map(ft => (
        <FloatingText
          key={ft.id}
          {...ft}
          onDone={() =>
            setFloatingTexts(p => p.filter(t => t.id !== ft.id))
          }
        />
      ))}
    </div>
  );
}