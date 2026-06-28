import { useState } from "react";
import { useGame } from "../context/GameContext";
import useGameTick from "../hooks/useGameTick";
import { formatTime } from "../hooks/formatTime";
import FloatingText from "../components/FloatingText";

const MINE_RESPAWN = 10000;

export default function Mine() {
  const { inventory, setInventory, minePlots, setMinePlots } = useGame();

  const [floatingTexts, setFloatingTexts] = useState([]);
  const [animIndex, setAnimIndex] = useState(null);

  useGameTick();

  const updated = minePlots.map(p =>
    !p.ready && Date.now() >= p.endTime ? { ready: true } : p
  );

  if (JSON.stringify(updated) !== JSON.stringify(minePlots)) {
    setMinePlots(updated);
  }

  const handleClick = (index, e) => {
    const plot = minePlots[index];
    if (!plot.ready || inventory.pickaxes <= 0) return;

    const rect = e.currentTarget.getBoundingClientRect();

    setAnimIndex(index);
    setTimeout(() => setAnimIndex(null), 300);

    setFloatingTexts(prev => [
      ...prev,
      {
        id: Date.now(),
        text: "+1 Gold",
        x: rect.left + rect.width / 2,
        y: rect.top
      }
    ]);

    const newPlots = [...minePlots];
    newPlots[index] = {
      ready: false,
      endTime: Date.now() + MINE_RESPAWN
    };

    setInventory(p => ({
      ...p,
      pickaxes: p.pickaxes - 1,
      gold: p.gold + 1
    }));

    setMinePlots(newPlots);
  };

  return (
    <div>
      <div className="mine-grid">
        {minePlots.map((plot, i) => {
          let status = "mine";
          let timeLeft = 0;

          if (!plot.ready) {
            timeLeft = plot.endTime - Date.now();
            status = timeLeft > 0 ? "recharging" : "mine";
          }

          return (
            <div
              key={i}
              className={`mine clickable ${status} ${
                animIndex === i ? "pulse" : ""
              }`}
              onClick={(e) => handleClick(i, e)}
            >
              <div>{status}</div>
              {status === "recharging" && <div>{formatTime(timeLeft)}</div>}
              {status === "mine" && <div>⛏</div>}
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