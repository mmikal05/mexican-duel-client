import { useState } from "react";
import { useGame } from "../context/GameContext";
import useGameTick from "../hooks/useGameTick";
import { formatTime } from "../hooks/formatTime";
import FloatingText from "../components/FloatingText";

const TREE_RESPAWN = 10000;

export default function Forest() {
  const { inventory, setInventory, forestPlots, setForestPlots } = useGame();

  const [floatingTexts, setFloatingTexts] = useState([]);
  const [animIndex, setAnimIndex] = useState(null);

  useGameTick();

  const updated = forestPlots.map(p =>
    !p.ready && Date.now() >= p.endTime ? { ready: true } : p
  );

  if (JSON.stringify(updated) !== JSON.stringify(forestPlots)) {
    setForestPlots(updated);
  }

  const handleClick = (index, e) => {
    const plot = forestPlots[index];
    if (!plot.ready || inventory.axes <= 0) return;

    const rect = e.currentTarget.getBoundingClientRect();

    setAnimIndex(index);
    setTimeout(() => setAnimIndex(null), 300);

    setFloatingTexts(prev => [
      ...prev,
      {
        id: Date.now(),
        text: "+1 Wood",
        x: rect.left + rect.width / 2,
        y: rect.top
      }
    ]);

    const newPlots = [...forestPlots];
    newPlots[index] = {
      ready: false,
      endTime: Date.now() + TREE_RESPAWN
    };

    setInventory(p => ({
      ...p,
      axes: p.axes - 1,
      wood: p.wood + 1
    }));

    setForestPlots(newPlots);
  };

  return (
    <div>
      <div className="forest-grid">
        {forestPlots.map((plot, i) => {
          let status = "tree";
          let timeLeft = 0;

          if (!plot.ready) {
            timeLeft = plot.endTime - Date.now();
            status = timeLeft > 0 ? "regrowing" : "tree";
          }

          return (
            <div
              key={i}
              className={`tree clickable ${status} ${
                animIndex === i ? "shake" : ""
              }`}
              onClick={(e) => handleClick(i, e)}
            >
              <div>{status}</div>
              {status === "regrowing" && <div>{formatTime(timeLeft)}</div>}
              {status === "tree" && <div>🌲</div>}
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