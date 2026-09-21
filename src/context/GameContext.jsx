import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { auth, db } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { createModel, sanitizeModel } from "../duel/aiBrain";
import { SUPPLY_RECIPES } from "../config/crafting";
import { GEAR_ITEMS } from "../config/equipment";
import { calculatePlayerStats } from "../config/stats";
import { getLevelInfo } from "../progression";

const GameContext = createContext();

const PLOT_COUNT = 4;

const createDefaultEquipped = () => ({
  head: null,
  chest: null,
  weapon: null,
  accessory: null,
});

// Single source of truth for a brand-new player.
const createDefaultState = () => ({
  exp: 0,
  coins: 100,
  duelCoins: 0,
  escrow: null, // coins currently staked in a running wager duel: { roomId, amount }
  inventory: {
    seeds: 0,
    wheat: 0,
    axes: 0,
    wood: 0,
    pickaxes: 0,
    gold: 0,
    feed: 0,
    leather: 0,
  },
  gear: [], // array of owned gear IDs (e.g. ["straw_sombrero", "rusty_machete"])
  equipped: createDefaultEquipped(),
  farmPlots: Array(PLOT_COUNT).fill(null),
  forestPlots: Array.from({ length: PLOT_COUNT }, () => ({ ready: true })),
  minePlots: Array.from({ length: PLOT_COUNT }, () => ({ ready: true })),
  shedPlots: Array(PLOT_COUNT).fill(null),
  duelStats: {
    wins: 0,
    losses: 0,
    ties: 0,
    aiWins: 0,
    aiLosses: 0,
    aiTies: 0,
    coinsWon: 0,
    coinsLost: 0,
  },
  aiModel: createModel(), // what the practice AI has learned about this player
});

export const GameProvider = ({ children }) => {
  const defaults = createDefaultState();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [exp, setExp] = useState(defaults.exp);
  const [player, setPlayer] = useState({ coins: defaults.coins, escrow: defaults.escrow });
  const [duelCoins, setDuelCoins] = useState(defaults.duelCoins);
  const [inventory, setInventory] = useState(defaults.inventory);
  const [gear, setGear] = useState(defaults.gear);
  const [equipped, setEquipped] = useState(defaults.equipped);
  const [farmPlots, setFarmPlots] = useState(defaults.farmPlots);
  const [forestPlots, setForestPlots] = useState(defaults.forestPlots);
  const [minePlots, setMinePlots] = useState(defaults.minePlots);
  const [shedPlots, setShedPlots] = useState(defaults.shedPlots);
  const [duelStats, setDuelStats] = useState(defaults.duelStats);
  const [aiModel, setAiModel] = useState(defaults.aiModel);

  const playerStats = useMemo(() => calculatePlayerStats(equipped), [equipped]);

  const applyState = (s) => {
    setExp(s.exp);
    setPlayer({ coins: s.coins, escrow: s.escrow });
    setDuelCoins(s.duelCoins);
    setInventory(s.inventory);
    setGear(s.gear);
    setEquipped(s.equipped);
    setFarmPlots(s.farmPlots);
    setForestPlots(s.forestPlots);
    setMinePlots(s.minePlots);
    setShedPlots(s.shedPlots);
    setDuelStats(s.duelStats);
    setAiModel(s.aiModel);
  };

  const loadFromFirebase = async (firebaseUser) => {
    const ref = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(ref);
    const fresh = createDefaultState();

    if (snap.exists()) {
      const data = snap.data();

      applyState({
        exp: data.exp ?? fresh.exp,
        coins: data.coins ?? fresh.coins,
        duelCoins: data.duelCoins ?? 0,
        escrow: data.escrow ?? null,
        inventory: { ...fresh.inventory, ...data.inventory },
        gear: Array.isArray(data.gear) ? data.gear : fresh.gear,
        equipped: { ...fresh.equipped, ...(data.equipped || {}) },
        farmPlots: data.farmPlots ?? fresh.farmPlots,
        forestPlots: data.forestPlots ?? fresh.forestPlots,
        minePlots: data.minePlots ?? fresh.minePlots,
        shedPlots: data.shedPlots ?? fresh.shedPlots,
        duelStats: { ...fresh.duelStats, ...data.duelStats },
        aiModel: sanitizeModel(data.aiModel),
      });
    } else {
      await setDoc(ref, {
        ...fresh,
        email: firebaseUser.email,
        createdAt: Date.now(),
      });
      applyState(fresh);
    }
  };

  const saveToFirebase = async () => {
    if (!user) return;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        exp,
        coins: player.coins,
        escrow: player.escrow ?? null,
        duelCoins,
        inventory,
        gear,
        equipped,
        farmPlots,
        forestPlots,
        minePlots,
        shedPlots,
        duelStats,
        aiModel,
      });
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await loadFromFirebase(firebaseUser);
          setUser(firebaseUser);
        } else {
          setUser(null);
          applyState(createDefaultState());
        }
      } catch (err) {
        console.error("Load failed:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    saveToFirebase();
  }, [exp, player, inventory, gear, equipped, farmPlots, forestPlots, minePlots, shedPlots, duelStats, aiModel, user, duelCoins]);

  /* ---------- crafting & equipment helpers ---------- */

  const craftSupply = (recipeId) => {
    const recipe = SUPPLY_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return false;

    // Check costs
    for (const [resKey, amount] of Object.entries(recipe.inputs)) {
      if ((inventory[resKey] || 0) < amount) return false;
    }

    setInventory((prev) => {
      const next = { ...prev };
      for (const [resKey, amount] of Object.entries(recipe.inputs)) {
        next[resKey] = Math.max(0, (next[resKey] || 0) - amount);
      }
      next[recipe.output.key] = (next[recipe.output.key] || 0) + recipe.output.qty;
      return next;
    });
    return true;
  };

  const craftGear = (gearId) => {
    const item = GEAR_ITEMS[gearId];
    if (!item) return false;
    if (gear.includes(gearId)) return false; // already owned

    // Level gate
    if (item.levelRequired && getLevelInfo(exp).level < item.levelRequired) return false;

    // Upgrade prerequisite: must own the tier below
    if (item.upgrades && !gear.includes(item.upgrades)) return false;

    for (const [resKey, amount] of Object.entries(item.recipe)) {
      if ((inventory[resKey] || 0) < amount) return false;
    }

    setInventory((prev) => {
      const next = { ...prev };
      for (const [resKey, amount] of Object.entries(item.recipe)) {
        next[resKey] = Math.max(0, (next[resKey] || 0) - amount);
      }
      return next;
    });

    setGear((prev) => {
      // Consume the prerequisite item (upgrade path)
      const next = item.upgrades ? prev.filter((id) => id !== item.upgrades) : [...prev];
      return [...next, gearId];
    });

    // Unequip consumed prerequisite, then auto-equip new item if slot is free
    setEquipped((prev) => {
      let next = { ...prev };
      if (item.upgrades) {
        const prereq = GEAR_ITEMS[item.upgrades];
        if (prereq && next[prereq.slot] === item.upgrades) next[prereq.slot] = null;
      }
      if (!next[item.slot]) next = { ...next, [item.slot]: gearId };
      return next;
    });

    return true;
  };

  const equipGear = (gearId) => {
    const item = GEAR_ITEMS[gearId];
    if (!item || !gear.includes(gearId)) return;
    setEquipped((prev) => ({ ...prev, [item.slot]: gearId }));
  };

  const unequipGear = (slot) => {
    setEquipped((prev) => ({ ...prev, [slot]: null }));
  };

  /* ---------- wager helpers (used by online duels) ---------- */

  const stakeCoins = (roomId, amount) =>
    setPlayer((prev) =>
      prev.escrow || prev.coins < amount
        ? prev
        : { coins: prev.coins - amount, escrow: { roomId, amount } }
    );

  const settleCoins = (roomId, payout) =>
    setPlayer((prev) =>
      prev.escrow?.roomId === roomId
        ? { coins: prev.coins + payout, escrow: null }
        : prev
    );

  const recordDuel = ({ mode, result, coinNet = 0 }) =>
    setDuelStats((prev) => {
      const next = { ...prev };
      const key = mode === "ai" ? "ai" : "";
      const field = { win: "Wins", lose: "Losses", tie: "Ties" }[result];
      if (!field) return prev;

      const name = key ? `ai${field}` : field.toLowerCase();
      next[name] = (next[name] || 0) + 1;

      if (mode !== "ai") {
        if (coinNet > 0) next.coinsWon = (next.coinsWon || 0) + coinNet;
        if (coinNet < 0) next.coinsLost = (next.coinsLost || 0) - coinNet;
      }
      return next;
    });

  const resetAiModel = () => setAiModel(createModel());

  const resetGame = async () => {
    if (!user) return;

    const fresh = createDefaultState();

    await setDoc(doc(db, "users", user.uid), {
      ...fresh,
      email: user.email,
      createdAt: Date.now(),
    });

    applyState(fresh);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <GameContext.Provider
      value={{
        user,
        loading,
        player,
        setPlayer,
        inventory,
        setInventory,
        gear,
        equipped,
        playerStats,
        craftSupply,
        craftGear,
        equipGear,
        unequipGear,
        farmPlots,
        setFarmPlots,
        forestPlots,
        setForestPlots,
        minePlots,
        setMinePlots,
        shedPlots,
        setShedPlots,
        exp,
        setExp,
        duelStats,
        recordDuel,
        aiModel,
        setAiModel,
        resetAiModel,
        stakeCoins,
        settleCoins,
        resetGame,
        logout,
        duelCoins,
        setDuelCoins,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
