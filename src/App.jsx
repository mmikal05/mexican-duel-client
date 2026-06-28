import { GameProvider, useGame } from "./context/GameContext";
import ScreenManager from "./navigation/ScreenManager";
import TopBar from "./components/TopBar";
import Login from "./screens/Login";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

function AppContent() {
  const { user, loading } = useGame();

  if (loading) return <div>Loading...</div>;

  if (!user) {return (<Login/>);}

  return (
    <>
      <TopBar />
      <ScreenManager />
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}