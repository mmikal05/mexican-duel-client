import { useState, useRef, useEffect } from "react";
import ScreenWrapper from "../components/ScreenWrapper";
import { useGame } from "../context/GameContext";
import { SUPPLY_RECIPES } from "../config/crafting";
import { GEAR_LIST, GEAR_SLOTS, GEAR_ITEMS } from "../config/equipment";
import { ITEMS } from "../config/items";
import { getLevelInfo } from "../progression";

export default function Workshop({ onNavigate }) {
  const { inventory, gear, equipped, craftSupply, craftGear, equipGear, exp } = useGame();
  const currentLevel = getLevelInfo(exp).level;
  const [tab, setTab] = useState("supplies");
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = (text, tone = "good") => {
    clearTimeout(toastTimer.current);
    setToast({ text, tone, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const handleCraftSupply = (recipe) => {
    const ok = craftSupply(recipe.id);
    if (ok) {
      showToast(`Crafted ${recipe.output.qty} × ${ITEMS[recipe.output.key]?.label || recipe.name}!`);
    } else {
      showToast("Missing required materials", "bad");
    }
  };

  const handleCraftGear = (item) => {
    const ok = craftGear(item.id);
    if (ok) {
      showToast(`Forged ${item.name} · Equipped to ${GEAR_SLOTS[item.slot]?.label}!`);
    } else {
      showToast("Cannot craft gear — check materials", "bad");
    }
  };

  return (
    <ScreenWrapper
      title="🔨 Workshop"
      subtitle="Refine harvested raw materials into working tools or forge powerful duel equipment."
    >
      <div className="segmented" role="tablist" aria-label="Workshop categories">
        <button
          role="tab"
          aria-selected={tab === "supplies"}
          onClick={() => setTab("supplies")}
        >
          Tools & Supplies
        </button>
        <button
          role="tab"
          aria-selected={tab === "gear"}
          onClick={() => setTab("gear")}
        >
          Duel Gear ({gear.length}/{GEAR_LIST.length})
        </button>
      </div>

      {tab === "supplies" && (
        <div className="craft-grid">
          {SUPPLY_RECIPES.map((recipe) => {
            const outputItem = ITEMS[recipe.output.key];
            const canCraft = Object.entries(recipe.inputs).every(
              ([k, amount]) => (inventory[k] || 0) >= amount
            );

            return (
              <div className="craft-card" key={recipe.id}>
                <div className="craft-header">
                  <span className="craft-icon">{recipe.icon}</span>
                  <div>
                    <h3 className="craft-name">{recipe.name}</h3>
                    <div className="muted small">
                      Yield: +{recipe.output.qty} {outputItem?.label}
                    </div>
                  </div>
                </div>

                <p className="craft-desc">{recipe.description}</p>

                <div className="craft-recipe">
                  <span className="recipe-title">Requires:</span>
                  <div className="recipe-pills">
                    {Object.entries(recipe.inputs).map(([k, amount]) => {
                      const owned = inventory[k] || 0;
                      const hasEnough = owned >= amount;
                      return (
                        <span
                          key={k}
                          className={`pill ${hasEnough ? "chip-green" : "pill-bad"}`}
                        >
                          {ITEMS[k]?.icon} {ITEMS[k]?.label}: {owned}/{amount}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="craft-actions">
                  <button
                    className="btn btn-primary btn-block btn-sm"
                    disabled={!canCraft}
                    onClick={() => handleCraftSupply(recipe)}
                  >
                    {canCraft ? `Craft +${recipe.output.qty}` : "Missing materials"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "gear" && (
        <div className="craft-grid">
          {GEAR_LIST.map((item) => {
            const isOwned = gear.includes(item.id);
            const isEquipped = equipped[item.slot] === item.id;
            const levelOk = currentLevel >= item.levelRequired;
            const prereqOwned = !item.upgrades || gear.includes(item.upgrades);
            const canCraft =
              !isOwned &&
              levelOk &&
              prereqOwned &&
              Object.entries(item.recipe).every(
                ([k, amount]) => (inventory[k] || 0) >= amount
              );

            return (
              <div className={`craft-card ${isOwned ? "owned" : ""}`} key={item.id}>
                <div className="craft-header">
                  <span className="craft-icon">{item.icon}</span>
                  <div>
                    <div className="craft-title-row">
                      <h3 className="craft-name">{item.name}</h3>
                      <span className={`tier-badge tier-${item.tier}`}>
                        Tier {item.tier}
                      </span>
                    </div>
                    <div className="muted small">
                      {GEAR_SLOTS[item.slot]?.icon} {GEAR_SLOTS[item.slot]?.label}
                    </div>
                  </div>
                </div>

                <p className="craft-desc">{item.description}</p>

                <div className="gear-stat-pills">
                  {item.statLabels.map((lbl, idx) => (
                    <span key={idx} className="stat-badge">
                      {lbl}
                    </span>
                  ))}
                </div>

                {item.upgrades && (
                  <div className="muted small" style={{ marginBottom: 4 }}>
                    ⬆️ Upgrade from {GEAR_ITEMS[item.upgrades]?.name}
                    {!prereqOwned && !isOwned && (
                      <span className="pill pill-bad" style={{ marginLeft: 6 }}>
                        Missing: {GEAR_ITEMS[item.upgrades]?.name}
                      </span>
                    )}
                  </div>
                )}

                <div className="craft-recipe">
                  <span className="recipe-title">
                    {isOwned ? "Craft Recipe:" : "Required Materials:"}
                  </span>
                  <div className="recipe-pills">
                    {Object.entries(item.recipe).map(([k, amount]) => {
                      const owned = inventory[k] || 0;
                      const hasEnough = owned >= amount;
                      return (
                        <span
                          key={k}
                          className={`pill ${
                            isOwned
                              ? "pill-gold"
                              : hasEnough
                              ? "chip-green"
                              : "pill-bad"
                          }`}
                        >
                          {ITEMS[k]?.icon} {ITEMS[k]?.label}: {owned}/{amount}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="craft-actions">
                  {isOwned ? (
                    <div className="owned-actions">
                      <span className="pill chip-green">✓ In Armoury</span>
                      {isEquipped ? (
                        <span className="pill pill-gold">Equipped</span>
                      ) : (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            equipGear(item.id);
                            showToast(`Equipped ${item.name}!`);
                          }}
                        >
                          Equip
                        </button>
                      )}
                    </div>
                  ) : !levelOk ? (
                    <span className="pill pill-bad">🔒 Requires Level {item.levelRequired}</span>
                  ) : (
                    <button
                      className="btn btn-primary btn-block btn-sm"
                      disabled={!canCraft}
                      onClick={() => handleCraftGear(item)}
                    >
                      {canCraft ? "Forge Gear" : "Missing materials"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div key={toast.id} className={`toast ${toast.tone}`} role="status">
          {toast.text}
        </div>
      )}
    </ScreenWrapper>
  );
}
