import { useState } from "react";
import ScreenWrapper from "../components/ScreenWrapper";
import { useGame } from "../context/GameContext";
import { GEAR_ITEMS, GEAR_SLOTS } from "../config/equipment";

export default function Armoury({ onNavigate }) {
  const { gear, equipped, equipGear, unequipGear, playerStats } = useGame();
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState(null);

  const showToast = (text, tone = "good") => {
    setToast({ text, tone, id: Date.now() });
    setTimeout(() => setToast(null), 2000);
  };

  const handleEquip = (id) => {
    equipGear(id);
    const item = GEAR_ITEMS[id];
    if (item) showToast(`Equipped ${item.name}!`);
  };

  const handleUnequip = (slot) => {
    unequipGear(slot);
    showToast(`Unequipped ${GEAR_SLOTS[slot]?.label}`);
  };

  const ownedItems = gear
    .map((id) => GEAR_ITEMS[id])
    .filter(Boolean)
    .filter((item) => filter === "all" || item.slot === filter);

  return (
    <ScreenWrapper
      title="🛡️ Armoury"
      subtitle="Equip your forged weapons and armor to boost your combat attributes and battle rewards."
    >
      {/* ---------- Loadout Overview ---------- */}
      <section className="card">
        <div className="card-head">
          <h3>🤠 Active Loadout</h3>
          <span className="pill pill-gold">
            {Object.values(equipped).filter(Boolean).length}/4 Slots Filled
          </span>
        </div>

        <div className="loadout-grid">
          {Object.entries(GEAR_SLOTS).map(([slotKey, slotMeta]) => {
            const equippedId = equipped[slotKey];
            const item = equippedId ? GEAR_ITEMS[equippedId] : null;

            return (
              <div
                key={slotKey}
                className={`loadout-slot ${item ? "filled" : "empty"}`}
              >
                <div className="slot-header">
                  <span className="slot-type">
                    {slotMeta.icon} {slotMeta.label}
                  </span>
                  {item && (
                    <button
                      className="slot-unequip"
                      onClick={() => handleUnequip(slotKey)}
                      title="Unequip"
                      aria-label={`Unequip ${item.name}`}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {item ? (
                  <div className="slot-content">
                    <span className="slot-item-icon">{item.icon}</span>
                    <div className="slot-details">
                      <div className="slot-item-name">{item.name}</div>
                      <div className="slot-stats">
                        {item.statLabels.map((lbl, i) => (
                          <span key={i} className="stat-pill-sm">
                            {lbl}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="slot-empty-text">
                    <span>{slotMeta.placeholder}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- Combat Stats Card ---------- */}
      <section className="card">
        <div className="card-head">
          <h3>⚔️ Battle Attributes</h3>
        </div>
        <div className="combat-stats-grid">
          <div className="combat-stat-tile">
            <span className="c-stat-label">❤️ Max Health</span>
            <strong className="c-stat-val">
              {playerStats.maxHp} HP
              {playerStats.hpBonus > 0 && (
                <small className="good"> (+{playerStats.hpBonus})</small>
              )}
            </strong>
          </div>

          <div className="combat-stat-tile">
            <span className="c-stat-label">🗡️ Hit Damage</span>
            <strong className="c-stat-val">
              {playerStats.attack} dmg
              {playerStats.attackBonus > 0 && (
                <small className="good"> (+{playerStats.attackBonus})</small>
              )}
            </strong>
          </div>

          <div className="combat-stat-tile">
            <span className="c-stat-label">🎯 Crit Chance</span>
            <strong className="c-stat-val">
              {Math.round(playerStats.critChance * 100)}%
              {playerStats.critBonus > 0 && (
                <small className="good">
                  {" "}
                  (+{Math.round(playerStats.critBonus * 100)}%)
                </small>
              )}
            </strong>
          </div>

          <div className="combat-stat-tile">
            <span className="c-stat-label">🛡️ Block Defense</span>
            <strong className="c-stat-val">
              {playerStats.blockDamage} dmg taken
              {playerStats.blockReduction > 0 && (
                <small className="good"> (-{playerStats.blockReduction})</small>
              )}
            </strong>
          </div>

          <div className="combat-stat-tile">
            <span className="c-stat-label">⭐ EXP Multiplier</span>
            <strong className="c-stat-val">
              +{Math.round(playerStats.expBonus * 100)}%
            </strong>
          </div>

          <div className="combat-stat-tile">
            <span className="c-stat-label">💰 Wager Bonus</span>
            <strong className="c-stat-val">
              +{Math.round(playerStats.coinBonus * 100)}%
            </strong>
          </div>
        </div>
      </section>

      {/* ---------- Wardrobe & Inventory ---------- */}
      <section className="card">
        <div className="card-head">
          <h3>🎒 Owned Gear</h3>
          <span className="muted small">{gear.length} crafted</span>
        </div>

        <div className="segmented" role="tablist" aria-label="Gear filter">
          <button
            role="tab"
            aria-selected={filter === "all"}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            role="tab"
            aria-selected={filter === "head"}
            onClick={() => setFilter("head")}
          >
            Head
          </button>
          <button
            role="tab"
            aria-selected={filter === "chest"}
            onClick={() => setFilter("chest")}
          >
            Chest
          </button>
          <button
            role="tab"
            aria-selected={filter === "weapon"}
            onClick={() => setFilter("weapon")}
          >
            Weapon
          </button>
          <button
            role="tab"
            aria-selected={filter === "accessory"}
            onClick={() => setFilter("accessory")}
          >
            Boots
          </button>
        </div>

        {ownedItems.length === 0 ? (
          <div className="empty-state">
            <p>No {filter === "all" ? "gear" : filter} crafted yet.</p>
            <p className="small">
              Harvest materials and forge custom sombreros, ponchos, and revolvers
              in the Workshop.
            </p>
            {onNavigate && (
              <button
                className="btn btn-primary"
                onClick={() => onNavigate("workshop")}
              >
                Go to Workshop
              </button>
            )}
          </div>
        ) : (
          <div className="wardrobe-list">
            {ownedItems.map((item) => {
              const isEquipped = equipped[item.slot] === item.id;
              return (
                <div
                  key={item.id}
                  className={`wardrobe-row ${isEquipped ? "is-equipped" : ""}`}
                >
                  <span className="wardrobe-icon">{item.icon}</span>
                  <div className="wardrobe-info">
                    <div className="wardrobe-title-row">
                      <strong>{item.name}</strong>
                      <span className={`tier-badge tier-${item.tier}`}>
                        Tier {item.tier}
                      </span>
                    </div>
                    <div className="wardrobe-stats">
                      {item.statLabels.join(" · ")}
                    </div>
                  </div>
                  {isEquipped ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleUnequip(item.slot)}
                    >
                      Unequip
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleEquip(item.id)}
                    >
                      Equip
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {toast && (
        <div key={toast.id} className={`toast ${toast.tone}`} role="status">
          {toast.text}
        </div>
      )}
    </ScreenWrapper>
  );
}
