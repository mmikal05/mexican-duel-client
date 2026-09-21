// One place for everything the game knows about its base items.
// Buy/sell prices are balanced for progressive tier yields and crafting conversion.

export const ITEMS = {
  seeds: { label: "Seeds", icon: "🌾", buy: 3, hint: "Plant on the Farm" },
  wheat: { label: "Wheat", icon: "🌽", sell: 4, hint: "Grown on the Farm or used to craft" },
  axes: { label: "Axe", icon: "🪓", buy: 6, hint: "One chop each, use in the Forest" },
  wood: { label: "Wood", icon: "🌲", sell: 9, hint: "Chopped in Forest or used in Workshop" },
  pickaxes: { label: "Pickaxe", icon: "⛏️", buy: 12, hint: "One swing each, use in the Mine" },
  gold: { label: "Gold", icon: "🪙", sell: 18, hint: "Mined in Mine or used for forging" },
  feed: { label: "Feed", icon: "🐄", buy: 20, hint: "Feeds one animal in the Shed" },
  leather: { label: "Leather", icon: "🧥", sell: 32, hint: "Made in Shed, prized for gear" },
};

export const BUYABLE = ["seeds", "axes", "pickaxes", "feed"];
export const SELLABLE = ["wheat", "wood", "gold", "leather"];
export const INVENTORY_ORDER = [...BUYABLE, ...SELLABLE].sort(
  (a, b) => Object.keys(ITEMS).indexOf(a) - Object.keys(ITEMS).indexOf(b)
);
