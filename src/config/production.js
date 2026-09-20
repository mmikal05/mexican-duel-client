/*
  The four production screens are the same machine with different labels.

  mode "grow":    an empty slot takes one `supply`, produces after `duration`,
                  then you collect one `output` (Farm, Shed).
  mode "harvest": a ready slot takes one `supply` (tool) and immediately gives
                  one `output`, then needs `duration` to recover (Forest, Mine).

  The plot shapes match what is already saved in players' profiles:
    grow:    null | { endTime }
    harvest: { ready: true } | { ready: false, endTime }
*/
export const PRODUCTION = {
  farm: {
    id: "farm",
    title: "Farm",
    icon: "🌾",
    accent: "#4ade80",
    plotsKey: "farmPlots",
    mode: "grow",
    supply: "seeds",
    output: "wheat",
    duration: 10000,
    subtitle: "Plant seeds, wait for them to grow, then harvest wheat.",
    verbs: { start: "Plant", collect: "Harvest", startAll: "Plant all", collectAll: "Harvest all" },
    tiles: {
      empty: { icon: "🟫", label: "Empty", action: "Tap to plant" },
      busy: { icon: "🌱", label: "Growing" },
      ready: { icon: "🌾", label: "Ready", action: "Tap to harvest" },
    },
  },
  forest: {
    id: "forest",
    title: "Forest",
    icon: "🌲",
    accent: "#34d399",
    plotsKey: "forestPlots",
    mode: "harvest",
    supply: "axes",
    output: "wood",
    duration: 10000,
    subtitle: "Spend an axe to chop a tree for wood. Trees regrow on their own.",
    verbs: { start: "Chop", startAll: "Chop all" },
    tiles: {
      ready: { icon: "🌲", label: "Tree", action: "Tap to chop" },
      busy: { icon: "🌱", label: "Regrowing" },
    },
  },
  mine: {
    id: "mine",
    title: "Mine",
    icon: "⛏️",
    accent: "#facc15",
    plotsKey: "minePlots",
    mode: "harvest",
    supply: "pickaxes",
    output: "gold",
    duration: 10000,
    subtitle: "Spend a pickaxe to break a rock for gold. Rocks recover over time.",
    verbs: { start: "Mine", startAll: "Mine all" },
    tiles: {
      ready: { icon: "🪨", label: "Rock", action: "Tap to mine" },
      busy: { icon: "⚒️", label: "Recovering" },
    },
  },
  shed: {
    id: "shed",
    title: "Shed",
    icon: "🐄",
    accent: "#fb7185",
    plotsKey: "shedPlots",
    mode: "grow",
    supply: "feed",
    output: "leather",
    duration: 10000,
    subtitle: "Feed your animals and collect leather when they are done.",
    verbs: { start: "Feed", collect: "Collect", startAll: "Feed all", collectAll: "Collect all" },
    tiles: {
      empty: { icon: "🐄", label: "Hungry", action: "Tap to feed" },
      busy: { icon: "🥩", label: "Working" },
      ready: { icon: "🧥", label: "Done", action: "Tap to collect" },
    },
  },
};

export const PRODUCTION_LIST = Object.values(PRODUCTION);

// Tile state for one plot: "empty" | "busy" | "ready"
export function plotState(config, plot, now = Date.now()) {
  if (config.mode === "grow") {
    if (!plot) return "empty";
    return now >= plot.endTime ? "ready" : "busy";
  }
  return plot.ready || now >= plot.endTime ? "ready" : "busy";
}

// Number of tiles the player can act on right now (used for the nav badges):
// finished output to collect, or ready tiles they actually have a tool for.
export function readyCount(config, plots, supply, now = Date.now()) {
  const ready = plots.filter((plot) => plotState(config, plot, now) === "ready").length;
  return config.mode === "grow" ? ready : Math.min(ready, Math.max(0, supply));
}
