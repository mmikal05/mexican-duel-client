import { useGame } from "../context/GameContext";

export default function TopBar({ onOpenInventory }) {
  const { user, player, exp, resetGame, logout } = useGame();

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <div className="avatar" />
        <div className="username">{user.email}</div>
      </div>

      <div className="coins">💰 COINS: {player.coins}</div>
      <div className="exp">⭐ EXP: {exp}</div>

      <button onClick={() => onOpenInventory?.()}>
        INVENTORY
      </button>

      <button onClick={resetGame} className="reset-btn">
        RESET GAME
      </button>

      <button onClick={logout} className="logout-btn">
        LOGOUT
      </button>
    </div>
  );
}