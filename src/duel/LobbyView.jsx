import useCountdown from "./useCountdown";

export default function LobbyView({ roomId, players, endsAt, ready, onReady }) {
  const secondsLeft = useCountdown(endsAt);
  const full = players.length === 2;

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Lobby #{roomId}</h2>
      {secondsLeft != null && <h3>Lobby closes in {secondsLeft}s</h3>}

      {players.map((player) => (
        <div key={player.pid} style={{ marginBottom: "10px" }}>
          {player.username}
          {player.ready ? " ✅ Ready" : " ⏳ Waiting"}
        </div>
      ))}

      {!full && <p>Waiting for an opponent to join…</p>}

      <button className="play-again-btn" disabled={ready || !full} onClick={onReady}>
        {ready ? "WAITING..." : "READY"}
      </button>
    </div>
  );
}
