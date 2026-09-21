import { useEffect, useRef, useState } from "react";
import ScreenWrapper from "../components/ScreenWrapper";
import { useGame } from "../context/GameContext";
import { ITEMS, BUYABLE, SELLABLE } from "../config/items";

export default function Shop({ onNavigate }) {
  const { player, setPlayer, inventory, setInventory } = useGame();
  const [tab, setTab] = useState("buy");
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = (text, tone = "") => {
    clearTimeout(toastTimer.current);
    setToast({ text, tone, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const lockedByEscrow = !!player.escrow;

  const buy = (key, qty) => {
    if (lockedByEscrow) return;
    const item = ITEMS[key];
    const cost = item.buy * qty;
    if (player.coins < cost) return;

    setPlayer((prev) => ({ ...prev, coins: prev.coins - cost }));
    setInventory((prev) => ({ ...prev, [key]: prev[key] + qty }));
    showToast(`Bought ${qty} × ${item.label} · −${cost} coins`);
  };

  const sell = (key, all) => {
    const owned = inventory[key];
    const qty = all ? owned : Math.min(1, owned);
    if (qty <= 0) return;

    const item = ITEMS[key];
    const earned = qty * item.sell;
    setInventory((prev) => ({ ...prev, [key]: prev[key] - qty }));
    setPlayer((prev) => ({ ...prev, coins: prev.coins + earned }));
    showToast(`Sold ${qty} × ${item.label} · +${earned} coins`, "good");
  };

  const sellable = SELLABLE.reduce((n, key) => n + inventory[key], 0);
  const sellableWorth = SELLABLE.reduce((n, key) => n + inventory[key] * ITEMS[key].sell, 0);

  return (
    <ScreenWrapper title="🛒 Shop" subtitle="Buy supplies to produce resources, then sell what you make.">
      <div className="shop-balance">
        <span className="stat-pill">💰 {player.coins} coins</span>
        {sellable > 0 && <span className="muted small">Your resources are worth 💰 {sellableWorth}</span>}
      </div>

      <div className="segmented" role="tablist" aria-label="Shop sections">
        <button role="tab" aria-selected={tab === "buy"} onClick={() => setTab("buy")}>
          Buy
        </button>
        <button role="tab" aria-selected={tab === "sell"} onClick={() => setTab("sell")}>
          Sell{sellable > 0 ? ` (${sellable})` : ""}
        </button>
      </div>

      {tab === "buy" && (
        <div className="shop-grid">
          {lockedByEscrow && (
            <div className="notice notice-error">
              You have coins staked in a duel — buying is locked.
            </div>
          )}
          {BUYABLE.map((key) => {
            const item = ITEMS[key];
            const canOne = player.coins >= item.buy;
            const canFive = player.coins >= item.buy * 5;

            return (
              <div className="shop-card" key={key}>
                <div className="shop-icon">{item.icon}</div>
                <div className="shop-name">{item.label}</div>
                <div className="shop-hint">{item.hint}</div>
                <div className="shop-owned">You have {inventory[key]}</div>
                <div className="shop-price">💰 {item.buy} each</div>
                <div className="shop-actions">
                  <button className="btn btn-primary btn-sm" disabled={!canOne} onClick={() => buy(key, 1)}>
                    {canOne ? "Buy 1" : "Not enough coins"}
                  </button>
                  <button className="btn btn-secondary btn-sm" disabled={!canFive} onClick={() => buy(key, 5)}>
                    Buy 5 · 💰 {item.buy * 5}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "sell" &&
        (sellable === 0 ? (
          <div className="empty-state">
            <p>Nothing to sell yet.</p>
            <p className="small">Wheat, wood, gold and leather show up here once you produce them.</p>
            {onNavigate && (
              <button className="btn btn-primary" onClick={() => onNavigate("farm")}>
                Go to the Farm
              </button>
            )}
          </div>
        ) : (
          <div className="shop-grid">
            {SELLABLE.map((key) => {
              const item = ITEMS[key];
              const owned = inventory[key];

              return (
                <div className="shop-card" key={key}>
                  <div className="shop-icon">{item.icon}</div>
                  <div className="shop-name">{item.label}</div>
                  <div className="shop-hint">{item.hint}</div>
                  <div className="shop-owned">You have {owned}</div>
                  <div className="shop-price">💰 {item.sell} each</div>
                  <div className="shop-actions">
                    <button className="btn btn-primary btn-sm" disabled={owned <= 0} onClick={() => sell(key, false)}>
                      Sell 1 · +{item.sell}
                    </button>
                    <button className="btn btn-secondary btn-sm" disabled={owned <= 0} onClick={() => sell(key, true)}>
                      Sell all{owned > 0 ? ` · +${owned * item.sell}` : ""}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {toast && (
        <div key={toast.id} className={`toast ${toast.tone}`} role="status">
          {toast.text}
        </div>
      )}
    </ScreenWrapper>
  );
}
