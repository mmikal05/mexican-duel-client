import useCountdown from "./useCountdown";
import { BODY_PARTS, MAX_HP } from "./constants";
import hatImg from "../assets/gear/Hat.png";
import jacketImg from "../assets/gear/Jacket.png";
import beltImg from "../assets/gear/Belt.png";
import pantsImg from "../assets/gear/Pants.png";
import bootsImg from "../assets/gear/Boots.png";

// These images are only the visuals for the five body zones, they carry no stats.
const ZONE_IMAGE = {
  head: hatImg,
  body: jacketImg,
  waist: beltImg,
  legs: pantsImg,
  foot: bootsImg,
};

const ZONE_TOP = { head: "8%", body: "28%", waist: "48%", legs: "68%", foot: "88%" };
const ZONE_SIZE = 75;

const RESULT_TITLE = {
  win: "🏆 VICTORY 🏆",
  lose: "💀 DEFEAT 💀",
  tie: "🤝 DRAW 🤝",
};

function Zone({ part, isTarget, selected, feedbackType, disabled, onClick }) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`part ${selected ? "selected" : ""} ${feedbackType || ""} ${
        isTarget ? "enemy-part" : "player-part"
      }`}
      style={{
        top: ZONE_TOP[part],
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: ZONE_SIZE,
        height: ZONE_SIZE,
        position: "absolute",
      }}
    >
      <div className="part-inner">
        <img src={ZONE_IMAGE[part]} alt={part} />
      </div>
    </div>
  );
}

function HpBar({ side, hp, max }) {
  return (
    <div className={`hp-bar-${side}`}>
      <div className={`hp-fill-${side}`} style={{ width: `${(hp / max) * 100}%` }} />
      <span>
        {hp} / {max}
      </span>
    </div>
  );
}

// The arena for one duel. Used by both online and vs-AI matches, so it only
// knows how to display state and report clicks.
export default function FightView({
  roundEndsAt,
  roundActive,
  status,
  playerHP,
  enemyHP,
  selection,
  feedback,
  log,
  result,
  onPick,
  onExit,
}) {
  const secondsLeft = useCountdown(roundEndsAt);
  const canPick = roundActive && !result;

  const feedbackFor = (side, part) =>
    feedback[side]?.part === part ? feedback[side].type : "";

  return (
    <>
      <div className="timer">⏱ {secondsLeft != null ? `${secondsLeft}s` : "–"}</div>

      {status && <div style={{ color: "#ffd166", margin: "6px 0" }}>{status}</div>}

      <div className="hp-container">
        <HpBar side="player" hp={playerHP} max={MAX_HP} />
        <HpBar side="enemy" hp={enemyHP} max={MAX_HP} />
      </div>

      <div className="duel-arena">
        <div className="character">
          <h4>🛡 Defend</h4>
          <div className="body">
            {BODY_PARTS.map((part) => (
              <Zone
                key={part}
                part={part}
                isTarget={false}
                selected={selection.defense === part}
                feedbackType={feedbackFor("player", part)}
                disabled={!canPick}
                onClick={() => onPick("defense", part)}
              />
            ))}
          </div>
        </div>

        <div className="character">
          <h4>🎯 Attack</h4>
          <div className="body enemy-body">
            {BODY_PARTS.map((part) => (
              <Zone
                key={part}
                part={part}
                isTarget
                selected={selection.attack === part}
                feedbackType={feedbackFor("enemy", part)}
                disabled={!canPick}
                onClick={() => onPick("attack", part)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="duel-log">
        {log.map((entry, i) => (
          <div key={i} className={`log-entry log-${entry.type}`}>
            {entry.text}
          </div>
        ))}
      </div>

      {result && (
        <div className="end-screen">
          <h2>{RESULT_TITLE[result]}</h2>
          <button onClick={onExit}>🏠 Home</button>
        </div>
      )}
    </>
  );
}
