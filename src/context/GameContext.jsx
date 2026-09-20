import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { createModel, sanitizeModel } from "../duel/aiBrain";

const GameContext = createContext();

const PLOT_COUNT = 4;

// Single source of truth for a brand-new player.
const createDefaultState = () => ({
  exp: 0,
  coins: 100,
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
  const [inventory, setInventory] = useState(defaults.inventory);
  const [farmPlots, setFarmPlots] = useState(defaults.farmPlots);
  const [forestPlots, setForestPlots] = useState(defaults.forestPlots);
  const [minePlots, setMinePlots] = useState(defaults.minePlots);
  const [shedPlots, setShedPlots] = useState(defaults.shedPlots);
  const [duelStats, setDuelStats] = useState(defaults.duelStats);
  const [aiModel, setAiModel] = useState(defaults.aiModel);

  const applyState = (s) => {
    setExp(s.exp);
    setPlayer({ coins: s.coins, escrow: s.escrow });
    setInventory(s.inventory);
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
        // "??" instead of "||" so a balance of 0 is not reset to 100
        coins: data.coins ?? fresh.coins,
        escrow: data.escrow ?? null,
        // merge so missing keys (older or partial saves) never become NaN
        inventory: { ...fresh.inventory, ...data.inventory },
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
        inventory,
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
  }, [exp, player, inventory, farmPlots, forestPlots, minePlots, shedPlots, duelStats, aiModel, user]);

  /* ---------- wager helpers (used by online duels) ---------- */

  // Take the stake out of the wallet and remember it, so it can be paid back
  // after a refresh or a lost connection. Does nothing if the player can't
  // afford it or already has a stake in a different duel.
  const stakeCoins = (roomId, amount) =>
    setPlayer((prev) =>
      prev.escrow || prev.coins < amount
        ? prev
        : { coins: prev.coins - amount, escrow: { roomId, amount } }
    );

  // Pay out (or refund) the stake of that duel. Ignored if it was already settled.
  const settleCoins = (roomId, payout) =>
    setPlayer((prev) =>
      prev.escrow?.roomId === roomId
        ? { coins: prev.coins + payout, escrow: null }
        : prev
    );

  // Keep the win/loss record; `coinNet` is coins gained (+) or lost (-) on the wager.
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
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
