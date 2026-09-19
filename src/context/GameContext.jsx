import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const GameContext = createContext();

const PLOT_COUNT = 4;

// Single source of truth for a brand-new player.
const createDefaultState = () => ({
  exp: 0,
  coins: 100,
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
});

export const GameProvider = ({ children }) => {
  const defaults = createDefaultState();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [exp, setExp] = useState(defaults.exp);
  const [player, setPlayer] = useState({ coins: defaults.coins });
  const [inventory, setInventory] = useState(defaults.inventory);
  const [farmPlots, setFarmPlots] = useState(defaults.farmPlots);
  const [forestPlots, setForestPlots] = useState(defaults.forestPlots);
  const [minePlots, setMinePlots] = useState(defaults.minePlots);
  const [shedPlots, setShedPlots] = useState(defaults.shedPlots);

  const applyState = (s) => {
    setExp(s.exp);
    setPlayer({ coins: s.coins });
    setInventory(s.inventory);
    setFarmPlots(s.farmPlots);
    setForestPlots(s.forestPlots);
    setMinePlots(s.minePlots);
    setShedPlots(s.shedPlots);
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
        // merge so missing keys (older or partial saves) never become NaN
        inventory: { ...fresh.inventory, ...data.inventory },
        farmPlots: data.farmPlots ?? fresh.farmPlots,
        forestPlots: data.forestPlots ?? fresh.forestPlots,
        minePlots: data.minePlots ?? fresh.minePlots,
        shedPlots: data.shedPlots ?? fresh.shedPlots,
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
        inventory,
        farmPlots,
        forestPlots,
        minePlots,
        shedPlots,
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
  }, [exp, player, inventory, farmPlots, forestPlots, minePlots, shedPlots, user]);

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
        resetGame,
        logout,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
