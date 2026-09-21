import { useState } from "react";
import ScreenWrapper from "../components/ScreenWrapper";
import { useGame } from "../context/GameContext";
import { ITEMS, SELLABLE, BUYABLE } from "../config/items";

/*
  Global Marketplace — P2P resource trading with DUEL COIN (🪙DC).

  Phase 1 (this build): personal listings scaffolded with simulated market
  orders so the screen feels live. Real P2P backend wires in behind the same
  interface when ready.

  Ways to earn DUEL COIN:
    • Win an online wager duel (+1 DC per win)
    • [Planned] First daily duel bonus
    • [Planned] Sell listings accepted by other players
    • [Planned] Tournament prizes
*/

// Simulated market feed — replaced by real Firestore listener later.
// ponytail: static seed data, replace with real-time Firestore collection query
const SEED_LISTINGS = [
  { id: "m1", seller: "Bandito99", resource: "wheat",   qty: 20, priceEach: 1, total: 20 },
  { id: "m2", seller: "SheriffBob", resource: "wood",    qty: 15, priceEach: 2, total: 30 },
  { id: "m3", seller: "DustDevil",  resource: "gold",    qty: 5,  priceEach: 5, total: 25 },
  { id: "m4", seller: "Vaquero",    resource: "leather", qty: 8,  priceEach: 6, total: 48 },
  { id: "m5", seller: "El Patron",  resource: "wheat",   qty: 50, priceEach: 1, total: 50 },
  { id: "m6", seller: "Cactus Kid", resource: "wood",    qty: 30, priceEach: 2, total: 60 },
];

const ALL_RESOURCES = [...new Set([...SELLABLE, ...BUYABLE])];

export default function Marketplace({ onNavigate }) {
  const { player, duelCoins, setDuelCoins, inventory, setInventory } = useGame();
  const [tab, setTab] = useState("buy");
  const [filter, setFilter] = useState("all");
  const [myListings, setMyListings] = useState([]);
  const [newListing, setNewListing] = useState({ resource: "wheat", qty: "", priceEach: "" });
  const [toast, setToast] = useState(null);

  const showToast = (text, tone = "good") => {
    setToast({ text, tone, id: Date.now() });
    setTimeout(() => setToast(null), 2200);
  };

  const marketListings = SEED_LISTINGS.filter(
    (l) => filter === "all" || l.resource === filter
  );

  const handleBuy = (listing) => {
    if (duelCoins < listing.total) {
      showToast("Not enough DUEL COIN", "bad");
      return;
    }
    setDuelCoins((prev) => prev - listing.total);
    setInventory((prev) => ({
      ...prev,
      [listing.resource]: (prev[listing.resource] || 0) + listing.qty,
    }));
    showToast(
      `Bought ${listing.qty} × ${ITEMS[listing.resource]?.label} for ${listing.total} DC`
    );
  };

  const handleList = () => {
    const qty = parseInt(newListing.qty);
    const price = parseInt(newListing.priceEach);
    const key = newListing.resource;

    if (!qty || qty <= 0 || !price || price <= 0) {
      showToast("Enter a valid quantity and price", "bad");
      return;
    }
    if ((inventory[key] || 0) < qty) {
      showToast(`You only have ${inventory[key] || 0} ${ITEMS[key]?.label}`, "bad");
      return;
    }

    setInventory((prev) => ({ ...prev, [key]: (prev[key] || 0) - qty }));
    setMyListings((prev) => [
      ...prev,
      { id: `own-${Date.now()}`, resource: key, qty, priceEach: price, total: qty * price },
    ]);
    setNewListing((prev) => ({ ...prev, qty: "", priceEach: "" }));
    showToast(`Listed ${qty} × ${ITEMS[key]?.label} at ${price} DC each`);
  };

  const handleCancel = (id) => {
    const listing = myListings.find((l) => l.id === id);
    if (!listing) return;
    setInventory((prev) => ({
      ...prev,
      [listing.resource]: (prev[listing.resource] || 0) + listing.qty,
    }));
    setMyListings((prev) => prev.filter((l) => l.id !== id));
    showToast("Listing cancelled — resources returned");
  };

  return (
    <ScreenWrapper
      title="🏪 Marketplace"
      subtitle="Trade resources with other players using DUEL COIN — the frontier's premium token."
    >
      {/* Balance row */}
      <div className="market-balance-row">
        <div className="market-balance-tile">
          <span className="muted small">🪙 DUEL COIN</span>
          <strong className="market-dc">{duelCoins} DC</strong>
        </div>
        <div className="market-balance-tile">
          <span className="muted small">💰 Coins</span>
          <strong>{player.coins}</strong>
        </div>
        <div className="market-earn-hint">
          <span className="muted small">Earn DC by winning online duels →</span>
          <button className="btn btn-gold btn-sm" onClick={() => onNavigate?.("duel")}>
            Duel
          </button>
        </div>
      </div>

      <div className="segmented" role="tablist" aria-label="Marketplace sections">
        <button role="tab" aria-selected={tab === "buy"} onClick={() => setTab("buy")}>
          Browse Listings
        </button>
        <button role="tab" aria-selected={tab === "sell"} onClick={() => setTab("sell")}>
          My Listings {myListings.length > 0 ? `(${myListings.length})` : ""}
        </button>
      </div>

      {tab === "buy" && (
        <>
          {/* Resource filter */}
          <div className="market-filter" role="group" aria-label="Filter by resource">
            <button
              className={`market-filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            {ALL_RESOURCES.map((key) => (
              <button
                key={key}
                className={`market-filter-btn ${filter === key ? "active" : ""}`}
                onClick={() => setFilter(key)}
              >
                {ITEMS[key]?.icon} {ITEMS[key]?.label}
              </button>
            ))}
          </div>

          <div className="market-listings">
            {marketListings.map((listing) => {
              const item = ITEMS[listing.resource];
              const canAfford = duelCoins >= listing.total;
              return (
                <div key={listing.id} className="market-row">
                  <span className="market-res-icon">{item?.icon}</span>
                  <div className="market-info">
                    <div className="market-resource-name">{item?.label}</div>
                    <div className="muted small">by {listing.seller}</div>
                  </div>
                  <div className="market-qty">×{listing.qty}</div>
                  <div className="market-price">
                    <strong>{listing.total} DC</strong>
                    <span className="muted small">{listing.priceEach} each</span>
                  </div>
                  <button
                    className={`btn btn-sm ${canAfford ? "btn-primary" : "btn-ghost"}`}
                    disabled={!canAfford}
                    title={!canAfford ? "Not enough DUEL COIN" : `Buy for ${listing.total} DC`}
                    onClick={() => handleBuy(listing)}
                  >
                    {canAfford ? "Buy" : "💸"}
                  </button>
                </div>
              );
            })}
          </div>

          {marketListings.length === 0 && (
            <div className="empty-state">
              <p>No listings for that resource right now.</p>
            </div>
          )}
        </>
      )}

      {tab === "sell" && (
        <>
          {/* New listing form */}
          <div className="card market-list-form">
            <div className="card-head">
              <h3>📋 New Listing</h3>
            </div>
            <div className="market-form-row">
              <select
                className="input market-select"
                value={newListing.resource}
                onChange={(e) => setNewListing((prev) => ({ ...prev, resource: e.target.value }))}
                aria-label="Resource to list"
              >
                {ALL_RESOURCES.map((key) => (
                  <option key={key} value={key}>
                    {ITEMS[key]?.icon} {ITEMS[key]?.label} (have {inventory[key] || 0})
                  </option>
                ))}
              </select>
            </div>
            <div className="market-form-row">
              <input
                className="input"
                type="number"
                min="1"
                placeholder="Qty"
                value={newListing.qty}
                onChange={(e) => setNewListing((prev) => ({ ...prev, qty: e.target.value }))}
                aria-label="Quantity to list"
              />
              <input
                className="input"
                type="number"
                min="1"
                placeholder="DC each"
                value={newListing.priceEach}
                onChange={(e) => setNewListing((prev) => ({ ...prev, priceEach: e.target.value }))}
                aria-label="Price per unit in DUEL COIN"
              />
            </div>
            {newListing.qty && newListing.priceEach && (
              <div className="muted small">
                Total: {parseInt(newListing.qty) * parseInt(newListing.priceEach) || 0} DC
              </div>
            )}
            <button className="btn btn-primary btn-block" onClick={handleList}>
              List for Sale
            </button>
          </div>

          {/* Active listings */}
          {myListings.length === 0 ? (
            <div className="empty-state">
              <p>No active listings.</p>
              <p className="small">List a resource above to start selling for DUEL COIN.</p>
            </div>
          ) : (
            <div className="market-listings">
              {myListings.map((listing) => {
                const item = ITEMS[listing.resource];
                return (
                  <div key={listing.id} className="market-row">
                    <span className="market-res-icon">{item?.icon}</span>
                    <div className="market-info">
                      <div className="market-resource-name">{item?.label}</div>
                      <div className="muted small">×{listing.qty} · {listing.priceEach} DC each</div>
                    </div>
                    <strong className="market-price-solo">{listing.total} DC</strong>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleCancel(listing.id)}
                    >
                      Cancel
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {toast && (
        <div key={toast.id} className={`toast ${toast.tone}`} role="status">
          {toast.text}
        </div>
      )}
    </ScreenWrapper>
  );
}
