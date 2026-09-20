import { useState } from "react";
import { useGame } from "./context/GameContext";
import ScreenManager from "./navigation/ScreenManager";
import TopBar from "./components/TopBar";
import InventoryPanel from "./components/InventoryPanel";
import Login from "./screens/Login";

function AppContent() {
  const { user, loading } = useGame();
  const [showInv, setShowInv] = useState(false);
  const [screen, setScreen] = useState("profile");

  if (loading) return <div className="loading-screen">Loading…</div>;

  if (!user) return <Login />;

  return (
    <>
      <TopBar onOpenInventory={() => setShowInv(true)} onNavigate={setScreen} />

      <InventoryPanel open={showInv} onClose={() => setShowInv(false)} />

      <ScreenManager screen={screen} onNavigate={setScreen} />
    </>
  );
}

export default function App() {
  return <AppContent />;
}
