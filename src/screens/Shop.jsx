import { useGame } from "../context/GameContext";
import ScreenWrapper from "../components/ScreenWrapper";

const BUY_ITEMS = [
  { key: "seeds", label: "Seeds", icon: "🌾", price: 2 },
  { key: "axes", label: "Axe", icon: "🪓", price: 4 },
  { key: "pickaxes", label: "Pickaxe", icon: "⛏️", price: 6 },
  { key: "feed", label: "Feed", icon: "🐄", price: 8 },
];

// Placeholder prices: each is 50% above the cost of the item that produces it
// (seed 2 -> wheat 3, axe 4 -> wood 6, pickaxe 6 -> gold 9, feed 8 -> leather 12).
// Tune these once crafting and wagers exist.
const SELL_ITEMS = [
  { key: "wheat", label: "Wheat", icon: "🌽", price: 3 },
  { key: "wood", label: "Wood", icon: "🌲", price: 6 },
  { key: "gold", label: "Gold", icon: "🪙", price: 9 },
  { key: "leather", label: "Leather", icon: "🧥", price: 12 },
];

export default function Shop() {
  const { player, setPlayer, inventory, setInventory } = useGame();

  const buyItem = (item) => {
    if (player.coins < item.price) return;

    setPlayer((prev) => ({ ...prev, coins: prev.coins - item.price }));
    setInventory((prev) => ({ ...prev, [item.key]: prev[item.key] + 1 }));
  };

  const sellItem = (item, all = false) => {
    const owned = inventory[item.key];
    const amount = all ? owned : Math.min(1, owned);
    if (amount <= 0) return;

    setInventory((prev) => ({ ...prev, [item.key]: prev[item.key] - amount }));
    setPlayer((prev) => ({ ...prev, coins: prev.coins + amount * item.price }));
  };

  return (
    <ScreenWrapper title="🛒 Shop">
      <div className="shop-container">
        <h4 className="shop-category">Tools & Supplies</h4>

        <div className="shop-grid">
          {BUY_ITEMS.map((item) => (
            <div className="shop-card" key={item.key}>
              <div className="shop-icon">{item.icon}</div>
              <div className="shop-name">{item.label}</div>
              <div className="shop-count">Owned: {inventory[item.key]}</div>
              <div className="shop-price">💰 {item.price} Coins</div>

              <button
                className="shop-btn"
                disabled={player.coins < item.price}
                onClick={() => buyItem(item)}
              >
                {player.coins < item.price ? "Not Enough" : "Buy"}
              </button>
            </div>
          ))}
        </div>

        <h4 className="shop-category">Sell Resources</h4>

        <div className="shop-grid">
          {SELL_ITEMS.map((item) => {
            const owned = inventory[item.key];

            return (
              <div className="shop-card" key={item.key}>
                <div className="shop-icon">{item.icon}</div>
                <div className="shop-name">{item.label}</div>
                <div className="shop-count">Owned: {owned}</div>
                <div className="shop-price">💰 {item.price} Coins each</div>

                <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                  <button
                    className="shop-btn"
                    disabled={owned <= 0}
                    onClick={() => sellItem(item)}
                  >
                    Sell
                  </button>
                  <button
                    className="shop-btn"
                    disabled={owned <= 0}
                    onClick={() => sellItem(item, true)}
                  >
                    Sell All
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScreenWrapper>
  );
}
