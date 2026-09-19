import { useState } from "react";
import { useGame } from "./context/GameContext";
import ScreenManager from "./navigation/ScreenManager";
import TopBar from "./components/TopBar";
import InventoryPanel from "./components/InventoryPanel";
import Login from "./screens/Login";

function AppContent() {
  const { user, loading } = useGame();
  const [showInv, setShowInv] = useState(false);

  if (loading) return <div>Loading...</div>;

  if (!user) return <Login />;

  return (
    <>
      <TopBar onOpenInventory={() => setShowInv(true)} />

      <InventoryPanel
        open={showInv}
        onClose={() => setShowInv(false)}
      />

      <ScreenManager />
    </>
  );
}

export default function App() {
  return <AppContent />;
}