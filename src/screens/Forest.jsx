import { useState } from "react";
import { useGame } from "../context/GameContext";
import useGameTick from "../hooks/useGameTick";
import { formatTime } from "../hooks/formatTime";
import FloatingText from "../components/FloatingText";

const TREE_RESPAWN = 10000;

const isReady = (plot) => plot.ready || Date.now() >= plot.endTime;

export default function Forest() {
  const { inventory, setInventory, forestPlots, setForestPlots } = useGame();

  const [floatingTexts, setFloatingTexts] = useState([]);
  const [animIndex, setAnimIndex] = useState(null);

  useGameTick();

  const handleClick = (index, e) => {
    const plot = forestPlots[index];
    if (!isReady(plot) || inventory.axes <= 0) return;

    const rect = e.currentTarget.getBoundingClientRect();

    setAnimIndex(index);
    setTimeout(() => setAnimIndex(null), 300);

    setFloatingTexts((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: "+1 Wood",
        x: rect.left + rect.width / 2,
        y: rect.top,
      },
    ]);

    const newPlots = [...forestPlots];
    newPlots[index] = { ready: false, endTime: Date.now() + TREE_RESPAWN };

    setInventory((p) => ({ ...p, axes: p.axes - 1, wood: p.wood + 1 }));
    setForestPlots(newPlots);
  };

  return (
    <div>
      <div className="forest-grid">
        {forestPlots.map((plot, i) => {
          const ready = isReady(plot);
          const timeLeft = ready ? 0 : plot.endTime - Date.now();
          const status = ready ? "tree" : "regrowing";

          return (
            <div
              key={i}
              className={`tree clickable ${status} ${
                animIndex === i ? "shake" : ""
              }`}
              onClick={(e) => handleClick(i, e)}
            >
              <div className="tree-icon">{ready ? "🌲" : "🌱"}</div>

              <div className="tree-status">
                {ready ? "Chop" : formatTime(timeLeft)}
              </div>

              {!ready && (
                <div className="tree-progress">
                  <div
                    className="tree-progress-fill"
                    style={{ width: `${100 - (timeLeft / TREE_RESPAWN) * 100}%` }}
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
