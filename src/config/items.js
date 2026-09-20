// One place for everything the game knows about its items.
// `buy` / `sell` are shop prices in coins (placeholders: sell = buy price + 50%
// of the item that produces it).
export const ITEMS = {
  seeds: { label: "Seeds", icon: "🌾", buy: 2, hint: "Plant on the Farm" },
  wheat: { label: "Wheat", icon: "🌽", sell: 3, hint: "Grown on the Farm" },
  axes: { label: "Axe", icon: "🪓", buy: 4, hint: "One chop each, use in the Forest" },
  wood: { label: "Wood", icon: "🌲", sell: 6, hint: "Chopped in the Forest" },
  pickaxes: { label: "Pickaxe", icon: "⛏️", buy: 6, hint: "One swing each, use in the Mine" },
  gold: { label: "Gold", icon: "🪙", sell: 9, hint: "Mined in the Mine" },
  feed: { label: "Feed", icon: "🐄", buy: 8, hint: "Feeds one animal in the Shed" },
  leather: { label: "Leather", icon: "🧥", sell: 12, hint: "Made in the Shed" },
};

export const BUYABLE = ["seeds", "axes", "pickaxes", "feed"];
export const SELLABLE = ["wheat", "wood", "gold", "leather"];
export const INVENTORY_ORDER = [...BUYABLE, ...SELLABLE].sort(
  (a, b) => Object.keys(ITEMS).indexOf(a) - Object.keys(ITEMS).indexOf(b)
);
