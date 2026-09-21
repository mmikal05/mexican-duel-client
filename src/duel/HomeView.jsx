import { useState } from "react";
import { WAGER_PRESETS, MAX_WAGER, XP_AI } from "./constants";
import { wagerBreakdown } from "./rules";
import { describeHabits } from "./aiBrain";

function WagerPicker({ coins, value, onChange }) {
  const [custom, setCustom] = useState("");
  const [overMax, setOverMax] = useState(false);

  const choose = (amount) => {
    setCustom("");
    setOverMax(false);
    onChange(amount);
  };

  const onCustom = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    setCustom(raw);
    const num = Number(raw);
    if (num > MAX_WAGER) {
      setOverMax(true);
      onChange(MAX_WAGER);
    } else {
      setOverMax(false);
      onChange(num);
    }
  };

  return (
    <div>
      <div className="chip-row" role="radiogroup" aria-label="Wager">
        {WAGER_PRESETS.map((amount) => {
          const disabled = amount > coins;
          return (
            <button
              key={amount}
              role="radio"
              aria-checked={value === amount && !custom}
              className={`chip-btn ${value === amount && !custom ? "active" : ""}`}
              disabled={disabled}
              onClick={() => choose(amount)}
            >
              {amount === 0 ? "Free" : `💰 ${amount}`}
            </button>
          );
        })}
        <input
          className={`chip-input ${overMax ? "over-max" : ""}`}
          inputMode="numeric"
          placeholder="Custom"
          value={custom}
          onChange={onCustom}
          aria-label="Custom wager"
        />
      </div>
      <p className="muted small">
        {overMax && <span className="bad block mb-1">Max wager is {MAX_WAGER} coins.</span>}
        {value === 0
          ? "No coins at stake. Just for the EXP."
          : `Each player stakes ${value} coins. The winner takes ${wagerBreakdown(value).winnerGets} (10% fee).`}
      </p>
    </div>
  );
}

export default function HomeView({
  coins,
  aiModel,
  error,
  openLobbies,
  onPlayAI,
  onCreate,
  onJoin,
}) {
  const [wager, setWager] = useState(0);
  const [joinId, setJoinId] = useState("");
  const habits = describeHabits(aiModel);

  return (
    <div className="duel-home">
      {error && (
        <div className="notice notice-error" role="alert">
          {error}
        </div>
      )}

      <section className="card">
        <div className="card-head">
          <h3>🧠 Practice vs AI</h3>
          <span className="pill">No wager</span>
        </div>
        <p className="muted">
          An opponent that studies how you play and adapts. Wins pay {XP_AI.win} EXP (draw {XP_AI.tie}, loss{" "}
          {XP_AI.lose}).
        </p>
        <p className="ai-memory">
          {aiModel.rounds === 0
            ? "It hasn't seen you fight yet, so it will play randomly at first."
            : `It has studied ${aiModel.rounds} of your rounds` +
              (habits
                ? ` and thinks you like to attack ${habits.attack.zone} and guard ${habits.defense.zone}.`
                : ".")}
        </p>
        <button className="btn btn-primary btn-block" onClick={onPlayAI}>
          Start practice match
        </button>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>⚔️ Online duel</h3>
          <span className="pill pill-gold">Win 200+ EXP</span>
        </div>
        <p className="muted">Challenge another player. You can put coins on it.</p>

        <WagerPicker coins={coins} value={wager} onChange={setWager} />

        <button className="btn btn-primary btn-block" onClick={() => onCreate(wager)}>
          Create lobby{wager > 0 ? ` · 💰 ${wager}` : ""}
        </button>

        <div className="divider">or join a friend</div>

        <div className="join-row">
          <input
            className="input"
            placeholder="Lobby code"
            value={joinId}
            maxLength={8}
            onChange={(e) => setJoinId(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && onJoin(joinId)}
            aria-label="Lobby code"
          />
          <button className="btn btn-secondary" onClick={() => onJoin(joinId)}>
            Join
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>🚪 Open lobbies</h3>
          <span className="muted small">updates live</span>
        </div>

        {openLobbies.length === 0 ? (
          <p className="muted">Nobody is waiting right now. Create a lobby and others can join it here.</p>
        ) : (
          <ul className="lobby-list">
            {openLobbies.map((lobby) => {
              const tooPoor = lobby.wager > coins;
              return (
                <li key={lobby.roomId} className="lobby-row">
                  <div>
                    <strong>{lobby.host}</strong>
                    <div className="muted small">#{lobby.roomId}</div>
                  </div>
                  <span className={`pill ${lobby.wager > 0 ? "pill-gold" : ""}`}>
                    {lobby.wager > 0 ? `💰 ${lobby.wager}` : "Free"}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={tooPoor}
                    title={tooPoor ? "You don't have enough coins for this wager" : ""}
                    onClick={() => onJoin(lobby.roomId)}
                  >
                    {tooPoor ? "Too pricey" : "Join"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
