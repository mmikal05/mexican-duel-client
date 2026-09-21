import { useState } from "react";
import ScreenWrapper from "../components/ScreenWrapper";
import ConfirmDialog from "../components/ConfirmDialog";
import { useGame } from "../context/GameContext";
import { getLevelInfo } from "../progression";
import { playerName } from "../playerName";
import { describeHabits } from "../duel/aiBrain";
import { ITEMS } from "../config/items";
import { PRODUCTION_LIST, plotState, readyCount } from "../config/production";
import { formatTime } from "../hooks/formatTime";

// One line per production screen: what needs the player's attention?
function todoFor(config, game) {
  const now = Date.now();
  const plots = game[config.plotsKey];
  const supplyCount = game.inventory[config.supply];
  const states = plots.map((p) => plotState(config, p, now));
  const ready = readyCount(config, plots, supplyCount, now);
  const busy = states.filter((s) => s === "busy").length;
  const grow = config.mode === "grow";
  const supply = ITEMS[config.supply];
  const output = ITEMS[config.output];

  if (ready > 0) {
    const text = grow
      ? `${ready} ${output.label.toLowerCase()} ready to collect`
      : `${ready} ready · ${supplyCount} ${supply.label.toLowerCase()} in stock`;
    return { text, attention: true };
  }
  if (grow && supplyCount > 0 && states.includes("empty")) {
    return { text: `${states.filter((s) => s === "empty").length} empty · ${supplyCount} ${supply.label.toLowerCase()} to use`, attention: true };
  }
  if (busy > 0) {
    // Find the soonest finishing plot to give a useful ETA.
    const soonest = plots
      .filter((p) => p?.endTime && plotState(config, p, now) === "busy")
      .reduce((min, p) => (p.endTime < min ? p.endTime : min), Infinity);
    const eta = soonest < Infinity ? ` · done in ${formatTime(soonest - now)}` : "";
    return { text: `${busy} working…${eta}`, attention: false };
  }
  if (supplyCount <= 0) return { text: `Out of ${supply.label.toLowerCase()}`, attention: false };
  return { text: "Idle", attention: false };
}

export default function Profile({ onNavigate }) {
  const game = useGame();
  const { user, player, exp, duelStats, duelCoins, aiModel, resetGame, resetAiModel, logout } = game;
  const [confirm, setConfirm] = useState(null); // "reset" | "ai" | null

  const level = getLevelInfo(exp);
  const name = playerName(user.email);

  const s = duelStats;
  const pvpGames = s.wins + s.losses + s.ties;
  const aiGames = s.aiWins + s.aiLosses + s.aiTies;
  const winRate = pvpGames ? Math.round((s.wins / pvpGames) * 100) : null;
  const coinNet = s.coinsWon - s.coinsLost;
  const habits = describeHabits(aiModel);

  return (
    <ScreenWrapper title="👤 Profile">
      <section className="card">
        <div className="profile-hero">
          <div className="avatar-xl">{name.charAt(0)}</div>
          <div className="profile-id">
            <h3>{name}</h3>
            <div className="muted small">{user.email}</div>
            <span className="level-badge">Level {level.level}</span>
          </div>
        </div>
        <div>
          <div className="exp-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level.progress * 100)} aria-label="Level progress">
            <div className="exp-fill" style={{ width: `${level.progress * 100}%` }} />
          </div>
          <div className="exp-caption">
            <span>
              {level.current} / {level.needed} EXP
            </span>
            <span>
              {level.toNext} to level {level.level + 1}
            </span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>📊 Stats</h3>
        </div>
        <div className="stat-tiles">
          <div className="stat-tile">
            <span>Coins</span>
            <strong>💰 {player.coins}</strong>
            {player.escrow && <small>+{player.escrow.amount} staked</small>}
          </div>
          <div className="stat-tile">
            <span>DUEL COIN</span>
            <strong style={{ color: "var(--gold)" }}>🪙 {duelCoins} DC</strong>
            <small>Earn by winning duels</small>
          </div>
          <div className="stat-tile">
            <span>Total EXP</span>
            <strong>⭐ {exp}</strong>
          </div>
          <div className="stat-tile">
            <span>Win rate</span>
            <strong>{winRate === null ? "–" : `${winRate}%`}</strong>
            <small>{pvpGames} online duels</small>
          </div>
          <div className="stat-tile record">
            <span>Online record</span>
            <strong>
              {s.wins}W {s.losses}L {s.ties}D
            </strong>
          </div>
          <div className="stat-tile record">
            <span>Practice record</span>
            <strong>
              {s.aiWins}W {s.aiLosses}L {s.aiTies}D
            </strong>
            <small>{aiGames} matches</small>
          </div>
          <div className="stat-tile">
            <span>Wager profit</span>
            <strong className={coinNet > 0 ? "good" : coinNet < 0 ? "bad" : ""}>
              {coinNet > 0 ? "+" : ""}
              {coinNet}
            </strong>
            <small>
              won {s.coinsWon} · lost {s.coinsLost}
            </small>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>🧭 What needs you</h3>
        </div>
        <ul className="todo-list">
          {PRODUCTION_LIST.map((config) => {
            const todo = todoFor(config, game);
            return (
              <li key={config.id} className={`todo-row ${todo.attention ? "attention" : ""}`}>
                <span className="todo-icon">{config.icon}</span>
                <div>
                  <strong>{config.title}</strong>
                  <div className="muted">{todo.text}</div>
                </div>
                <button className={`btn btn-sm ${todo.attention ? "btn-gold" : "btn-secondary"}`} onClick={() => onNavigate?.(config.id)}>
                  Go
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>🧠 Practice AI</h3>
        </div>
        <p className="muted">
          {aiModel.rounds === 0
            ? "The AI hasn't studied you yet."
            : `It has studied ${aiModel.rounds} of your rounds` +
              (habits ? ` and thinks you favour attacking ${habits.attack.zone} and guarding ${habits.defense.zone}.` : ".")}
        </p>
        <div className="button-row">
          <button className="btn btn-secondary btn-sm" disabled={aiModel.rounds === 0} onClick={() => setConfirm("ai")}>
            Reset AI memory
          </button>
        </div>
      </section>

      <section className="card danger-zone">
        <div className="card-head">
          <h3>Account</h3>
        </div>
        <div className="button-row">
          <button className="btn btn-ghost" onClick={logout}>
            Log out
          </button>
          <button className="btn btn-danger" onClick={() => setConfirm("reset")}>
            Reset game
          </button>
        </div>
      </section>

      {confirm === "reset" && (
        <ConfirmDialog
          title="Reset your game?"
          message="This erases your coins, EXP, inventory, plots and duel record. It can't be undone."
          confirmLabel="Reset everything"
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            resetGame();
          }}
        />
      )}

      {confirm === "ai" && (
        <ConfirmDialog
          title="Reset the AI's memory?"
          message="The practice AI forgets everything it learned about how you play and starts from scratch."
          confirmLabel="Reset AI"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            resetAiModel();
          }}
        />
      )}
    </ScreenWrapper>
  );
}
