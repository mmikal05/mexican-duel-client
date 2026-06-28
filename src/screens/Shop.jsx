import { useGame } from "../context/GameContext";
import ScreenWrapper from "../components/ScreenWrapper";

export default function Shop() {
  const { player, setPlayer, inventory, setInventory } = useGame();

  const buySeeds = () => {
    if (player.coins < 1) return;

    setPlayer(prev => ({
      ...prev,
      coins: prev.coins - 1,
    }));

    setInventory(prev => ({
      ...prev,
      seeds: prev.seeds + 1,
    }));
  };

  const buyAxe = () => {
    if (player.coins < 1) return;

    setPlayer(prev => ({
      ...prev,
      coins: prev.coins - 1,
    }));

    setInventory(prev => ({
      ...prev,
      axes: prev.axes + 1,
    }));
  };

  const buyPickaxe = () => {
    if (player.coins < 1) return;

    setPlayer(prev => ({ 
      ...prev,
      coins: prev.coins - 1,
    }));

    setInventory(prev => ({ 
      ...prev,
      pickaxes: prev.pickaxes + 1,
    }));
  };

  const buyFeed = () => {
    if (player.coins < 1) return;

    setPlayer(prev => ({ 
      ...prev,
      coins: prev.coins - 1,
    }));

    setInventory(prev => ({ 
      ...prev,
      feed: prev.feed + 1,
    }));
  };

  return (
    <ScreenWrapper title="🛒 Shop">
      <button onClick={buySeeds}>Buy Seed</button>
      <button onClick={buyAxe}>Buy Axe</button>
      <button onClick={buyPickaxe}>Buy Pickaxe</button>
      <button onClick={buyFeed}>Buy Feed</button>

      <p>Seeds: {inventory.seeds}</p>
      <p>Axes: {inventory.axes}</p>
      <p>Pickaxes: {inventory.pickaxes}</p>
      <p>Feed: {inventory.feed}</p>
    </ScreenWrapper>
  );
}