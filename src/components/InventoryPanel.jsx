import { useGame } from "../context/GameContext";

export default function InventoryPanel({ open, onClose }) {
  const { inventory } = useGame();

  return (
    <>
      {open && <div className="inv-backdrop" onClick={onClose} />}

      <div className={`inv-panel ${open ? "open" : ""}`}>
        <div className="inv-header">
          <h3>Inventory</h3>
          <button onClick={onClose}>✖</button>
        </div>

        <div className="inv-content">
          <div className="inv-item">🌾<span>{inventory.seeds} Seeds</span></div>
          <div className="inv-item">🌽<span>{inventory.wheat} Wheat</span></div>
          <div className="inv-item">🪓<span>{inventory.axes} Axes</span></div>
          <div className="inv-item">🌲<span>{inventory.wood} Wood</span></div>
          <div className="inv-item">⛏️<span>{inventory.pickaxes} Pickaxes</span></div>
          <div className="inv-item">🪙<span>{inventory.gold} Gold</span></div>
          <div className="inv-item">🐄<span>{inventory.feed} Feed</span></div>
          <div className="inv-item">🧥<span>{inventory.leather} Leather</span></div>
        </div>
      </div>
    </>
  );
}