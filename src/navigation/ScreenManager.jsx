import { useState } from "react";
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

export default function ScreenManager() {
  const [screen, setScreen] = useState("profile");

  const renderScreen = () => {
    switch (screen) {
      case "farm": return <Farm />;
      case "forest": return <Forest />;
      case "mine": return <Mine />;
      case "shed": return <Shed />;
      case "workshop": return <Workshop />;
      case "armoury": return <Armoury />;
      case "duel": return <Duel />;
      case "profile": return <Profile />;
      case "shop": return <Shop />;
      default: return <Farm />;
    }
  };

  return (
    <>
      {renderScreen()}
      <BottomNav setScreen={setScreen} />
    </>
  );
}