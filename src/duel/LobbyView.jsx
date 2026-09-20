import { useState } from "react";
import useCountdown from "./useCountdown";
import EmoteBar, { EmoteBubble } from "./EmoteBar";
import { wagerBreakdown } from "./rules";

const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function PlayerCard({ player, isMe, emote }) {
  if (!player) {
    return (
      <div className="player-card empty">
        <div className="avatar-lg dim">?</div>
        <div className="muted">Waiting for an opponent…</div>
      </div>
    );
  }

  return (
    <div className={`player-card ${player.ready ? "ready" : ""}`}>
      <EmoteBubble emote={emote} />
      <div className="avatar-lg">{player.username.charAt(0).toUpperCase()}</div>
      <div className="player-name">
        {player.username}
        {isMe && <span className="pill">You</span>}
      </div>
      <div className={`ready-tag ${player.ready ? "on" : ""}`}>{player.ready ? "✅ Ready" : "⏳ Not ready"}</div>
    </div>
  );
}

export default function LobbyView({
  roomId,
  players,
  myPid,
  endsAt,
  ttl,
  wager,
  ready,
  coins,
  emotes,
  onReady,
  onUnready,
  onLeave,
  onEmote,
}) {
  const secondsLeft = useCountdown(endsAt);
  const [copied, setCopied] = useState(false);

  const me = players.find((p) => p.pid === myPid);
  const foe = players.find((p) => p.pid !== myPid);
  const full = players.length === 2;
  const canAfford = coins >= wager;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable (e.g. insecure page): the code is on screen anyway */
    }
  };

  let hint = "Waiting for an opponent to join…";
  if (full && !canAfford) hint = `You need ${wager} coins to play this wager.`;
  else if (full && ready) hint = "Waiting for your opponent to get ready…";
  else if (full) hint = "Press Ready when you are set.";

  return (
    <div className="lobby">
      <section className="card lobby-code">
        <span className="muted small">Share this code</span>
        <div className="code-row">
          <code className="code">{roomId}</code>
          <button className="btn btn-secondary btn-sm" onClick={copy}>
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
        {secondsLeft != null && (
          <div className="lobby-timer">
            <div
              className="lobby-timer-fill"
              style={{ width: `${Math.min(100, (secondsLeft / Math.max(1, ttl / 1000)) * 100)}%` }}
            />
            <span>Lobby closes in {clock(secondsLeft)}</span>
          </div>
        )}
      </section>

      <div className={`wager-banner ${wager > 0 ? "on" : ""}`}>
        {wager > 0 ? (
          <>
            💰 <strong>{wager} coins</strong> each · winner takes <strong>{wagerBreakdown(wager).winnerGets}</strong>
            <span className="muted small"> (10% fee)</span>
          </>
        ) : (
          <>Friendly match · no coins at stake</>
        )}
      </div>

      <div className="versus">
        <PlayerCard player={me} isMe emote={emotes?.me} />
        <div className="vs">VS</div>
        <PlayerCard player={foe} emote={emotes?.foe} />
      </div>

      <p className="muted center">{hint}</p>

      <div className="lobby-actions">
        <button className="btn btn-ghost" onClick={onLeave}>
          Leave lobby
        </button>
        {ready ? (
          <button className="btn btn-secondary" onClick={onUnready}>
            Cancel ready
          </button>
        ) : (
          <button className="btn btn-primary" disabled={!full || !canAfford} onClick={onReady}>
            Ready
          </button>
        )}
      </div>

      <EmoteBar onEmote={onEmote} />
    </div>
  );
}
