import { useEffect } from "react";
import { useGame } from "../context/GameContext";
import { ITEMS, BUYABLE, SELLABLE } from "../config/items";

function Group({ title, keys, inventory }) {
  return (
    <div className="inv-section">
      <h4>{title}</h4>
      <div className="inv-grid">
        {keys.map((key) => (
          <div key={key} className={`inv-item ${inventory[key] === 0 ? "empty" : ""}`}>
            <span className="inv-icon">{ITEMS[key].icon}</span>
            <span className="inv-count">{inventory[key]}</span>
            <span className="inv-name">{ITEMS[key].label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InventoryPanel({ open, onClose }) {
  const { inventory } = useGame();

  // Esc closes the drawer
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const worth = SELLABLE.reduce((n, key) => n + inventory[key] * ITEMS[key].sell, 0);

  return (
    <>
      {open && <div className="inv-backdrop" onClick={onClose} />}

      <aside className={`inv-panel ${open ? "open" : ""}`} aria-hidden={!open} aria-label="Inventory">
        <div className="inv-header">
          <h3>🎒 Inventory</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close inventory" tabIndex={open ? 0 : -1}>
            ✕
          </button>
        </div>

        <Group title="Supplies" keys={BUYABLE} inventory={inventory} />
        <Group title="Resources" keys={SELLABLE} inventory={inventory} />

        <div className="inv-total">
          <span>Resources worth</span>
          <span>💰 {worth}</span>
        </div>
      </aside>
    </>
  );
}
