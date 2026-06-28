import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [exp, setExp] = useState(0);
  const [player, setPlayer] = useState({ coins: 100 });
  const [inventory, setInventory] = useState({
    seeds: 0,
    wheat: 0,
    axes: 0,
    wood: 0,
    pickaxes: 0,
    gold: 0,
    feed: 0,
    leather: 0,
  });

  const loadFromFirebase = async (firebaseUser) => {
    const ref = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();

      setUser(firebaseUser);
      setExp(data.exp || 0);
      setPlayer({
        coins: data.coins || 100,
      });
      setInventory(data.inventory || {
        seeds: 0,
        wheat: 0,
        axes: 0,
        wood: 0,
        pickaxes: 0,
        gold: 0,
        feed: 0,
        leather: 0,
      });} 
      
      else {
      await setDoc(ref, {
        exp: 0,
        coins: 100,
        inventory,
        createdAt: Date.now(),
      });
    }
  };

  const [farmPlots, setFarmPlots] = useState(() => {
    const saved = localStorage.getItem("farmPlots");
    return saved
      ? JSON.parse(saved)
      : Array(4).fill(null);
  });

  const [forestPlots, setForestPlots] = useState(() => {
    const saved = localStorage.getItem("forestPlots");
    return saved
      ? JSON.parse(saved)
      : Array.from({ length: 4 }, () => ({ ready: true }));
  });

  const [minePlots, setMinePlots] = useState(() => {
    const saved = localStorage.getItem("minePlots");
    return saved
      ? JSON.parse(saved)
      : Array.from({ length: 4 }, () => ({ ready: true }));
  });

  const [shedPlots, setShedPlots] = useState(() => {
    const saved = localStorage.getItem("shedPlots");
    return saved
      ? JSON.parse(saved)
      : Array(4).fill(null);
  });

  const saveToFirebase = async () => {
    if (!user) return;

    const ref = doc(db, "users", user.uid);

    await updateDoc(ref, {
      exp,
      coins: player.coins,
      inventory,
    });
  };

  useEffect(() => {
    localStorage.setItem("farmPlots", JSON.stringify(farmPlots));
  }, [farmPlots]);

  useEffect(() => {
    localStorage.setItem("forestPlots", JSON.stringify(forestPlots));
  }, [forestPlots]);

  useEffect(() => {
    localStorage.setItem("minePlots", JSON.stringify(minePlots));
  }, [minePlots]);

  useEffect(() => {
    localStorage.setItem("shedPlots", JSON.stringify(shedPlots));
  }, [shedPlots]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await loadFromFirebase(firebaseUser);
        setUser(firebaseUser);
      }

      else {
        setUser(null);
        setExp(0);
        setPlayer({ coins: 100 });
        setInventory({
          seeds: 0,
          wheat: 0,
          axes: 0,
          wood: 0,
          pickaxes: 0,
          gold: 0,
          feed: 0,
          leather: 0,
        });
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {if (!user) return; saveToFirebase();}, [exp, player, inventory, user]);

  const resetGame = () => {
    localStorage.clear();

    setFarmPlots(Array(4).fill(null));
    setForestPlots(Array.from({ length: 4 }, () => ({ ready: true })));
    setMinePlots(Array.from({ length: 4 }, () => ({ ready: true })));
    setShedPlots(Array(4).fill(null));

    if (user) {
      const ref = doc(db, "users", user.uid);

      setDoc(ref, {
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
        createdAt: Date.now(),
      });
    }
  };

  const logout = async () => {await signOut(auth);}

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
        logout
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);