import { useGame } from "../context/GameContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function TopBar() {
  const { user, player, exp } = useGame();

  const { resetGame, logout } = useGame();

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <div className="avatar" />
          <div className="username">{user.email}</div>
      </div>

      <div className="coins">💰 COINS: {player.coins}</div>
      <div className="exp">⭐ EXP: {exp}</div>
      <button onClick={resetGame} className="reset-btn">RESET GAME</button>
      <button onClick={logout} className="logout-btn">LOGOUT</button>
    </div>
  );
}