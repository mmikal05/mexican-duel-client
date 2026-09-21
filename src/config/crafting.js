// Recipes for converting raw materials directly into supplies & tools in the Workshop.

export const SUPPLY_RECIPES = [
  {
    id: "craft_seeds",
    name: "Sort Grain Seeds",
    output: { key: "seeds", qty: 2 },
    inputs: { wheat: 3 },
    icon: "🌾",
    category: "supplies",
    description: "Thresh 3 harvested Wheat into 2 ready-to-plant Seeds.",
  },
  {
    id: "craft_feed",
    name: "Mix Animal Feed",
    output: { key: "feed", qty: 1 },
    inputs: { wheat: 4, wood: 1 },
    icon: "🐄",
    category: "supplies",
    description: "Combine 4 Wheat and 1 Wood into nutritious livestock Feed.",
  },
  {
    id: "craft_axes",
    name: "Forge Lumber Axes",
    output: { key: "axes", qty: 2 },
    inputs: { wood: 3, gold: 1 },
    icon: "🪓",
    category: "supplies",
    description: "Shape 3 Wood and 1 Gold into 2 sharp Lumber Axes.",
  },
  {
    id: "craft_pickaxes",
    name: "Forge Mining Picks",
    output: { key: "pickaxes", qty: 2 },
    inputs: { wood: 4, gold: 2 },
    icon: "⛏️",
    category: "supplies",
    description: "Craft 2 heavy Pickaxes from 4 Wood and 2 Gold nuggets.",
  },
];
