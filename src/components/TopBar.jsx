import { useGame } from "../context/GameContext";
import { getLevelInfo } from "../progression";
import { playerName } from "../playerName";

export default function TopBar({ onOpenInventory, onNavigate }) {
  const { user, player, exp } = useGame();
  const level = getLevelInfo(exp);
  const name = playerName(user.email);

  return (
    <header className="top-bar">
      <button className="top-user" onClick={() => onNavigate?.("profile")} aria-label="Open profile">
        <span className="avatar">{name.charAt(0)}</span>
        <span className="top-user-text">
          <span className="username">{name}</span>
          <span className="level-line">
            Level {level.level} · {exp} EXP
          </span>
        </span>
      </button>

      <span className="top-spacer" />

      <span className="stat-pill" aria-label={`${player.coins} coins`}>
        💰 <span key={player.coins} className="flash">{player.coins}</span>
        {player.escrow && <small>+{player.escrow.amount} staked</small>}
      </span>

      <button className="icon-btn" onClick={() => onOpenInventory?.()} aria-label="Open inventory">
        🎒
      </button>

      <div className="top-exp" aria-hidden="true">
        <span style={{ width: `${level.progress * 100}%` }} />
      </div>
    </header>
  );
}
