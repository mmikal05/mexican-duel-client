import { useEffect, useRef, useState } from "react";
import useCountdown from "./useCountdown";
import { BODY_PARTS, MAX_HP, ROUND_TIME } from "./constants";
import EmoteBar, { EmoteBubble } from "./EmoteBar";
import ConfirmDialog from "../components/ConfirmDialog";
import hatImg from "../assets/gear/Hat.png";
import jacketImg from "../assets/gear/Jacket.png";
import beltImg from "../assets/gear/Belt.png";
import pantsImg from "../assets/gear/Pants.png";
import bootsImg from "../assets/gear/Boots.png";

// These images are only the visuals for the five body zones, they carry no stats.
const ZONES = [
  { part: "head", label: "Head", img: hatImg },
  { part: "body", label: "Body", img: jacketImg },
  { part: "waist", label: "Waist", img: beltImg },
  { part: "legs", label: "Legs", img: pantsImg },
  { part: "foot", label: "Feet", img: bootsImg },
];
const ZONE_BY_PART = Object.fromEntries(ZONES.map((z) => [z.part, z]));

const FEEDBACK_LABEL = { hit: "Hit", crit: "Crit!", block: "Blocked", miss: "Miss" };

function HpBar({ side, name, hp, emote }) {
  const previous = useRef(hp);
  const [loss, setLoss] = useState(null);

  // Pop up the damage number whenever HP drops.
  useEffect(() => {
    if (hp < previous.current) {
      setLoss({ amount: previous.current - hp, id: Date.now() });
      const id = setTimeout(() => setLoss(null), 1100);
      previous.current = hp;
      return () => clearTimeout(id);
    }
    previous.current = hp;
  }, [hp]);

  const pct = Math.max(0, Math.min(100, (hp / MAX_HP) * 100));

  return (
    <div className={`hp hp-${side}`}>
      <div className="hp-name">
        <span>{name}</span>
        <EmoteBubble emote={emote} />
      </div>
      <div className="hp-track">
        <div className="hp-fill" style={{ width: `${pct}%` }} />
        <span className="hp-text">
          {hp} / {MAX_HP}
        </span>
        {loss && (
          <span key={loss.id} className="hp-loss">
            -{loss.amount}
          </span>
        )}
      </div>
    </div>
  );
}

// The drain animation is set up once per round (the parent re-renders several times a second).
function TimerFill({ endsAt }) {
  const [style] = useState(() => {
    const remaining = Math.max(0, endsAt - Date.now());
    return {
      "--from": `${Math.min(100, (remaining / (ROUND_TIME * 1000)) * 100)}%`,
      animationDuration: `${remaining}ms`,
    };
  });
  return <div className="timer-fill" style={style} />;
}

function ZoneColumn({ title, kind, selected, feedback, disabled, onPick }) {
  return (
    <div className={`zone-col zone-col-${kind}`}>
      <h4>{title}</h4>
      {ZONES.map(({ part, label, img }) => {
        const result = feedback?.part === part ? feedback.type : "";
        return (
          <button
            key={part}
            className={`zone ${selected === part ? "selected" : ""} ${result}`}
            disabled={disabled}
            aria-pressed={selected === part}
            onClick={() => onPick(part)}
          >
            <img src={img} alt="" />
            <span>{label}</span>
            {result && <em>{FEEDBACK_LABEL[result]}</em>}
          </button>
        );
      })}
    </div>
  );
}

// The arena for one duel. Used by both online and vs-AI matches, so it only
// knows how to display state and report clicks.
export default function FightView({
  mode,
  round,
  roundEndsAt,
  roundActive,
  status,
  playerHP,
  enemyHP,
  selection,
  feedback,
  log,
  lockedMe,
  lockedFoe,
  wager = 0,
  myName = "You",
  foeName = "AI",
  emotes,
  onPick,
  onLock,
  onLeave,
  onEmote,
}) {
  const secondsLeft = useCountdown(roundEndsAt);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const canPick = roundActive && !lockedMe;
  const canLock = canPick && selection.attack && selection.defense;

  let lockLabel = "Lock in";
  if (lockedMe) lockLabel = "🔒 Locked in";
  else if (!roundActive) lockLabel = "Next round…";
  else if (!selection.attack || !selection.defense) lockLabel = "Pick attack & defense";

  const leaveText =
    mode === "ai"
      ? "Leave the practice match? You won't get any EXP."
      : wager > 0
      ? `Forfeit the duel? Your opponent wins the ${wager * 2}-coin pot and you lose your ${wager}-coin stake.`
      : "Forfeit the duel? Your opponent wins.";

  return (
    <div className="fight">
      <div className="fight-top">
        <span className="chip">Round {round || 1}</span>
        {wager > 0 && <span className="chip chip-gold">💰 Pot {wager * 2}</span>}
        <span className="timer" aria-live="off">
          ⏱ {secondsLeft != null ? `${secondsLeft}s` : "–"}
        </span>
      </div>

      <div className="timer-track">
        {roundEndsAt && <TimerFill key={roundEndsAt} endsAt={roundEndsAt} />}
      </div>

      {status && (
        <div className="notice" role="status">
          {status}
        </div>
      )}

      <div className="hp-row">
        <HpBar side="player" name={myName} hp={playerHP} emote={emotes?.me} />
        <HpBar side="enemy" name={foeName} hp={enemyHP} emote={emotes?.foe} />
      </div>

      <div className="arena">
        <ZoneColumn
          title="🛡 Defend"
          kind="defend"
          selected={selection.defense}
          feedback={feedback.player}
          disabled={!canPick}
          onPick={(part) => onPick("defense", part)}
        />
        <ZoneColumn
          title="🎯 Attack"
          kind="attack"
          selected={selection.attack}
          feedback={feedback.enemy}
          disabled={!canPick}
          onPick={(part) => onPick("attack", part)}
        />
      </div>

      <div className="fight-actions">
        <button className="btn btn-primary btn-lock" disabled={!canLock} onClick={onLock}>
          {lockLabel}
        </button>
        {lockedFoe && !lockedMe && <span className="chip chip-green">{foeName} locked in</span>}
        <button className="btn btn-ghost btn-sm" onClick={() => setConfirmLeave(true)}>
          {mode === "ai" ? "Leave" : "🏳 Forfeit"}
        </button>
      </div>

      {onEmote && <EmoteBar onEmote={onEmote} />}

      <div className="duel-log" aria-label="Battle log">
        {log.map((entry, i) => (
          <div key={i} className={`log-entry log-${entry.type}`}>
            {entry.text}
          </div>
        ))}
      </div>

      {confirmLeave && (
        <ConfirmDialog
          title={mode === "ai" ? "Leave match?" : "Forfeit duel?"}
          message={leaveText}
          confirmLabel={mode === "ai" ? "Leave" : "Forfeit"}
          danger
          onCancel={() => setConfirmLeave(false)}
          onConfirm={() => {
            setConfirmLeave(false);
            onLeave();
          }}
        />
      )}
    </div>
  );
}

export { ZONE_BY_PART, BODY_PARTS };
