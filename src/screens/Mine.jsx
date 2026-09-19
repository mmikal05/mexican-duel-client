import { useState } from "react";
import { useGame } from "../context/GameContext";
import useGameTick from "../hooks/useGameTick";
import { formatTime } from "../hooks/formatTime";
import FloatingText from "../components/FloatingText";

const MINE_RESPAWN = 10000;

const isReady = (plot) => plot.ready || Date.now() >= plot.endTime;

export default function Mine() {
  const { inventory, setInventory, minePlots, setMinePlots } = useGame();

  const [floatingTexts, setFloatingTexts] = useState([]);
  const [animIndex, setAnimIndex] = useState(null);

  useGameTick();

  const handleClick = (index, e) => {
    const plot = minePlots[index];
    if (!isReady(plot) || inventory.pickaxes <= 0) return;

    const rect = e.currentTarget.getBoundingClientRect();

    setAnimIndex(index);
    setTimeout(() => setAnimIndex(null), 300);

    setFloatingTexts((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: "+1 Gold",
        x: rect.left + rect.width / 2,
        y: rect.top,
      },
    ]);

    const newPlots = [...minePlots];
    newPlots[index] = { ready: false, endTime: Date.now() + MINE_RESPAWN };

    setInventory((p) => ({ ...p, pickaxes: p.pickaxes - 1, gold: p.gold + 1 }));
    setMinePlots(newPlots);
  };

  return (
    <div>
      <div className="mine-grid">
        {minePlots.map((plot, i) => {
          const ready = isReady(plot);
          const timeLeft = ready ? 0 : plot.endTime - Date.now();
          // class names match mine.css (.rock.ready / .rock.cooldown)
          const status = ready ? "ready" : "cooldown";

          return (
            <div
              key={i}
              className={`rock clickable ${status} ${
                animIndex === i ? "impact" : ""
              }`}
              onClick={(e) => handleClick(i, e)}
            >
              <div className="rock-icon">{ready ? "🪨" : "⚒️"}</div>

              <div className="rock-status">
                {ready ? "Mine" : formatTime(timeLeft)}
              </div>

              {!ready && (
                <div className="rock-progress">
                  <div
                    className="rock-progress-fill"
                    style={{ width: `${100 - (timeLeft / MINE_RESPAWN) * 100}%` }}
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
