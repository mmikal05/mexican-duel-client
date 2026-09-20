import { useEffect, useState } from "react";
import { useGame } from "../context/GameContext";
import { getLevelInfo } from "../progression";

const TITLES = {
  win: { icon: "🏆", text: "Victory!" },
  lose: { icon: "💀", text: "Defeat" },
  tie: { icon: "🤝", text: "Draw" },
  void: { icon: "↩️", text: "Match cancelled" },
};

function reasonText({ result, reason }) {
  if (reason === "stake") return "A player couldn't cover the wager, so the duel was cancelled.";
  if (reason === "lost") return "The match was lost by the server. Your stake was returned.";
  if (reason === "forfeit") return result === "win" ? "Your opponent forfeited." : "You forfeited the duel.";
  if (reason === "timeout")
    return result === "win" ? "Your opponent left and didn't come back." : "You left the match and timed out.";
  if (result === "win") return "You knocked your opponent out.";
  if (result === "lose") return "You were knocked out.";
  return "Both fighters went down together.";
}

function coinLine({ result, wager, fee, staked, coinNet, payout }) {
  if (!wager || !staked) return { text: "Friendly match · no coins at stake", tone: "", note: "" };
  if (result === "win")
    return {
      text: `+${coinNet} coins`,
      tone: "good",
      note: `Pot ${wager * 2} − ${fee} fee = ${payout} paid out`,
    };
  if (result === "lose") return { text: `−${wager} coins`, tone: "bad", note: "" };
  return { text: `Stake of ${wager} returned`, tone: "", note: "" };
}

export default function EndScreen({ summary, onClose, onPlayAgain }) {
  const { exp } = useGame();

  // The reward was applied just before this screen opened, so the current EXP
  // already includes it. Freeze it so later changes don't move the bar.
  const [expAfter] = useState(exp);
  const before = getLevelInfo(Math.max(0, expAfter - summary.expGain));
  const after = getLevelInfo(expAfter);
  const leveledUp = after.level > before.level;

  // animate the bar from where it was to where it is now
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setFilled(true), 150);
    return () => clearTimeout(id);
  }, []);
  const barStart = leveledUp ? 0 : before.progress;
  const barWidth = `${(filled ? after.progress : barStart) * 100}%`;

  const title = TITLES[summary.result];
  const coins = coinLine(summary);
  const { stats } = summary;
  const isAI = summary.mode === "ai";

  return (
    <div className="end-screen" role="dialog" aria-modal="true" aria-label={title.text}>
      <div className={`end-card end-${summary.result}`}>
        <div className="end-icon">{title.icon}</div>
        <h2>{title.text}</h2>
        <p className="muted">{reasonText(summary)}</p>
        {!isAI && summary.opponent && summary.result !== "void" && (
          <p className="muted small">vs {summary.opponent}</p>
        )}

        <div className="reward">
          <div className="reward-row">
            <span>⭐ EXP</span>
            <strong className={summary.expGain > 0 ? "good" : ""}>+{summary.expGain}</strong>
          </div>
          <div className="exp-bar">
            <div className="exp-fill" style={{ width: barWidth }} />
          </div>
          <div className="reward-sub muted small">
            Level {after.level} · {after.current} / {after.needed} EXP
          </div>
          {leveledUp && (
            <div className="levelup">
              🎉 Level up! {before.level} → {after.level}
            </div>
          )}

          {summary.expDetail && (
            <div className="reward-sub muted small">
              Damage {stats.dealt} × 1.1 = {summary.expDetail.damage} · HP left × 1.2 = {summary.expDetail.health} · base{" "}
              {summary.expDetail.base}
              {summary.expDetail.half ? " · halved: your opponent left" : ""}
            </div>
          )}

          <div className="reward-row">
            <span>💰 Coins</span>
            <strong className={coins.tone}>{coins.text}</strong>
          </div>
          {coins.note && <div className="reward-sub muted small">{coins.note}</div>}
        </div>

        {stats.rounds > 0 && (
          <div className="stat-grid">
            <div>
              <strong>{stats.rounds}</strong>
              <span>Rounds</span>
            </div>
            <div>
              <strong>{stats.dealt}</strong>
              <span>Damage dealt</span>
            </div>
            <div>
              <strong>{stats.taken}</strong>
              <span>Damage taken</span>
            </div>
            <div>
              <strong>{stats.crits}</strong>
              <span>Crits</span>
            </div>
            <div>
              <strong>{stats.blocked}</strong>
              <span>Blocks</span>
            </div>
          </div>
        )}

        {isAI && stats.rounds > 0 && (
          <p className="ai-note">
            🧠 The AI guessed your attack in {summary.aiGuarded} of {stats.rounds} rounds (
            {Math.round((summary.aiGuarded / stats.rounds) * 100)}%). Pure guessing would manage about 20%. It has
            now studied {summary.aiStudied} rounds of your play.
          </p>
        )}

        <div className="end-actions">
          {isAI && (
            <button className="btn btn-primary" onClick={onPlayAgain}>
              Play again
            </button>
          )}
          <button className={`btn ${isAI ? "btn-secondary" : "btn-primary"}`} onClick={onClose}>
            Back to menu
          </button>
        </div>
      </div>
    </div>
  );
}
