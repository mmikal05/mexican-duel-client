import Farm from "../screens/Farm";
import Forest from "../screens/Forest";
import Mine from "../screens/Mine";
import Shed from "../screens/Shed";
import Workshop from "../screens/Workshop";
import Armoury from "../screens/Armoury";
import Duel from "../screens/Duel";
import Profile from "../screens/Profile";
import Shop from "../screens/Shop";
import BottomNav from "../components/BottomNav";
import { useGame } from "../context/GameContext";
import useGameTick from "../hooks/useGameTick";
import { useMatchLocked } from "../duel/matchLock";
import useResumeDuel from "../duel/useResumeDuel";
import { PRODUCTION_LIST, readyCount } from "../config/production";

const SCREENS = {
  profile: Profile,
  farm: Farm,
  forest: Forest,
  mine: Mine,
  shed: Shed,
  shop: Shop,
  duel: Duel,
  workshop: Workshop,
  armoury: Armoury,
};

// `screen` / `onNavigate` come from App so the top bar can navigate too.
export default function ScreenManager({ screen, onNavigate }) {
  const game = useGame();
  const locked = useMatchLocked();
  useGameTick(); // keeps the "ready" badges current while a timer finishes
  useResumeDuel(onNavigate); // a refresh mid-duel drops you back into it

  const badges = {};
  for (const config of PRODUCTION_LIST) {
    badges[config.id] = readyCount(config, game[config.plotsKey], game.inventory[config.supply]);
  }

  const Screen = SCREENS[screen] ?? Profile;

  return (
    <>
      <Screen onNavigate={onNavigate} />
      <BottomNav screen={screen} onNavigate={onNavigate} badges={badges} locked={locked} />
    </>
  );
}
