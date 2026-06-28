import { useEffect, useState } from "react";
import ScreenWrapper from "../components/ScreenWrapper";
import { useGame } from "../context/GameContext";
import "../styles/duel.css";
import { io } from "socket.io-client";
import hatImg from "../assets/gear/Hat.png";
import jacketImg from "../assets/gear/Jacket.png";
import beltImg from "../assets/gear/Belt.png";
import pantsImg from "../assets/gear/Pants.png";
import bootsImg from "../assets/gear/Boots.png";

const socket = io("mexican-duel-server-production.up.railway.app", {
  transports: ["websocket"],
});

const BODY_PARTS = ["head", "body", "waist", "legs", "foot"];
const ROUND_TIME = 10;

const PART_POSITIONS = {
  head: { top: "8%", left: "50%", size: 75 },
  body: { top: "28%", left: "50%", size: 75 },
  waist: { top: "48%", left: "50%", size: 75 },
  legs: { top: "68%", left: "50%", size: 75 },
  foot: { top: "88%", left: "50%", size: 75 },
};

export default function Duel() {
  const { user } = useGame();
  const { exp, setExp } = useGame();
  const [view, setView] = useState("home");
  const [playerHP, setPlayerHP] = useState(100);
  const [enemyHP, setEnemyHP] = useState(100);
  const [playerAttack, setPlayerAttack] = useState(null);
  const [playerDefense, setPlayerDefense] = useState(null);
  const [timer, setTimer] = useState(ROUND_TIME);
  const [roundActive, setRoundActive] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [log, setLog] = useState([]);
  const [damageDealt, setDamageDealt] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState(null);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [joinLobbyId, setJoinLobbyId] = useState("");
  const [lobbyTimer, setLobbyTimer] = useState(60);
  const [ready, setReady] = useState(false);

  const gear = {
    hat: { crit: 0.05, img: hatImg },
    jacket: { hp: 20, img: jacketImg },
    belt: { damage: 3, img: beltImg },
    pants: { reduction: 0.1, img: pantsImg },
    boots: { invincibility: 0.05, img: bootsImg },
  };

  const playerStats = {
    critChance: 0.2 + gear.hat.crit,
    invincibility: 0.1 + gear.boots.invincibility,
  };

  const playerBaseDamage = 10 + gear.belt.damage;
  const playerDamageReduction = gear.pants.reduction;
  const playerMaxHP = 100 + gear.jacket.hp;
  const enemyMaxHP = 100;
  const enemyStats = { critChance: 0.15, invincibility: 0.1 };
  const baseDamage = 10;

  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Connected:", socket.id);
    });

    socket.on("matchCreated", ({ roomId }) => {
      console.log("🎯 Lobby created:", roomId);
      setRoomId(roomId);
      setLobbyPlayers([]);
      setView("lobby");
      setTimer(60);
      setReady(false);
    });

    socket.on("lobby", ({ roomId, players }) => {
      setRoomId(roomId);
      setLobbyPlayers(players);
      setView("lobby");
      setReady(false);
    });

    socket.on("lobbyExpired", () => {
      alert("Lobby expired");
      setView("home");
      setRoomId(null);
      setLobbyPlayers([]);
    });

    socket.on("duelStart", () => {
      setView("fight");
      setRoundActive(true);
      setTimer(ROUND_TIME);
      addLog("Duel Started!");
    });

    socket.on("reconnected", ({ roomId }) => {
      setRoomId(roomId);
      setView("fight");
      addLog("Reconnected");
    });

    socket.on("playerDisconnected", () => {
      addLog("Opponent disconnected. Waiting 30s...");
    });

    socket.on("opponentForfeit", () => {
      setResult("win");
      setGameOver(true);
    });

    socket.on("roundResult", ({ hp, results }) => {
      setRoundActive(false);

      const myId = socket.id;
      const enemyId = Object.keys(hp).find(id => id !== myId);

      setPlayerHP(hp[myId]);
      setEnemyHP(hp[enemyId]);

      setFeedback({
        player: {
          part: results[enemyId].attack,
          type: results[enemyId].type,
        },
        enemy: {
          part: results[myId].attack,
          type: results[myId].type,
        },
      });

      addLog(
        `You hit ${results[myId].attack} → ${results[myId].type.toUpperCase()} (${results[myId].damage})`,
        results[myId].type
      );

      addLog(
        `Enemy hit ${results[enemyId].attack} → ${results[enemyId].type.toUpperCase()} (${results[enemyId].damage})`,
        results[enemyId].type
      );

      setTimeout(() => {
        if (hp[myId] <= 0 && hp[enemyId] <= 0) {
          setResult("tie");
          setGameOver(true);
          setExp(prev => prev + 50);
        } else if (hp[enemyId] <= 0) {
          setResult("win");
          setGameOver(true);
          setExp(prev => prev + 100);
        } else if (hp[myId] <= 0) {
          setResult("lose");
          setGameOver(true);
          setExp(prev => prev + 25);
        } else {
          startNewRound();
        }
      }, 1000);
    });

    socket.on("opponentLeft", () => {
      addLog("Opponent disconnected. You win!");
      setResult("win");
      setGameOver(true);
    });

    return () => {
      socket.off("connect");
      socket.off("matchCreated");
      socket.off("lobby");
      socket.off("lobbyExpired");
      socket.off("duelStart");
      socket.off("reconnected");
      socket.off("playerDisconnected");
      socket.off("opponentForfeit");
      socket.off("roundResult");
      socket.off("opponentLeft");
    };
  }, 
  []);

  useEffect(() => {
    socket.emit("reconnectPlayer", {
      playerId: localStorage.getItem("playerId"),
    });
  }, 
  []);

  const addLog = (text, type = "") => {
    setLog(prev => [{ text, type }, ...prev.slice(0, 10)]);
  };

  const enemyPick = () => ({
    attack: BODY_PARTS[Math.floor(Math.random() * 5)],
    defense: BODY_PARTS[Math.floor(Math.random() * 5)],
  });

  const startDuel = () => {
    setIsMultiplayer(false);
    setPlayerHP(playerMaxHP);
    setEnemyHP(enemyMaxHP);
    setDamageDealt(0);
    setLog([]);
    setFeedback({});
    setGameOver(false);
    setResult(null);
    setPlayerAttack(null);
    setPlayerDefense(null);
    setTimer(ROUND_TIME);
    setRoundActive(true);
    setView("fight");
  };

  useEffect(() => {
    if (view !== "lobby") return;

    if (lobbyTimer <= 0) return;

    const t = setTimeout(() => {
      setLobbyTimer(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(t);
  }, [lobbyTimer, view]);

  useEffect(() => {
    if (!roundActive || gameOver) return;

    if (timer <= 0) {
      if (isMultiplayer) {
        submitMove();
      } else {
        resolveRound();
      }
      return;
    }

    const t = setTimeout(() => {
      setTimer(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(t);
  }, [timer, roundActive, gameOver]);

  const createLobby = () => {
    console.log("Create Lobby");
    if (!user) {alert("You must be logged in");return;}
    setIsMultiplayer(true);
    socket.emit("createLobby", { username: user.email });
  };

  const joinLobby = () => {
    if (!user?.email.trim()) return alert("Enter Username");

    if (!joinLobbyId.trim()) return alert("Enter Lobby ID");

    setIsMultiplayer(true);

    socket.emit("joinMatch", {
      roomId: joinLobbyId,
      username: user.email,
    });
  };

  const startNewRound = () => {
    if (gameOver) return;
    setPlayerAttack(null);
    setPlayerDefense(null);
    setTimer(ROUND_TIME);
    setRoundActive(true);
    setFeedback({});
  };

  const submitMove = () => {
    setRoundActive(false);
    socket.emit("move", {
      roomId,
      attack: playerAttack,
      defense: playerDefense,
    });
  };

  const resolveHit = (attack, defend, atkStats, defStats, isPlayer = false) => {
    let damage = isPlayer ? playerBaseDamage : baseDamage;

    if (!attack) return { damage: 0, type: "miss", label: "MISS" };
    if (Math.random() < defStats.invincibility)
      return { damage: 0, type: "miss", label: "MISS" };

    if (attack === defend) {
      damage *= 0.5;
      return { damage: Math.floor(damage), type: "block", label: "BLOCKED" };
    }

    if (Math.random() < atkStats.critChance) {
      damage *= 2;
      return { damage: Math.floor(damage), type: "crit", label: "CRITICAL" };
    }

    return { damage: Math.floor(damage), type: "hit", label: "HIT" };
  };

  const resolveRound = () => {
    setRoundActive(false);

    const enemy = enemyPick();

    const playerResult = resolveHit(
      playerAttack,
      enemy.defense,
      playerStats,
      enemyStats,
      true
    );

    const enemyResult = resolveHit(
      enemy.attack,
      playerDefense,
      enemyStats,
      playerStats
    );

    const reducedDamage = Math.floor(
      enemyResult.damage * (1 - playerDamageReduction)
    );

    const newEnemyHP = Math.max(enemyHP - playerResult.damage, 0);
    const newPlayerHP = Math.max(playerHP - reducedDamage, 0);

    setEnemyHP(newEnemyHP);
    setPlayerHP(newPlayerHP);
    setDamageDealt(prev => prev + playerResult.damage);

    setFeedback({
      player: { part: enemy.attack, type: enemyResult.type },
      enemy: { part: playerAttack, type: playerResult.type },
    });

    addLog(`You attacked → ${playerResult.label}`, playerResult.type);
    addLog(`Enemy attacked → ${enemyResult.label}`, enemyResult.type);

    setTimeout(() => {
      if (newPlayerHP <= 0 && newEnemyHP <= 0) {
        setResult("tie");
        setGameOver(true);
      } else if (newEnemyHP <= 0) {
        setResult("win");
        setGameOver(true);
      } else if (newPlayerHP <= 0) {
        setResult("lose");
        setGameOver(true);
      } else {
        startNewRound();
      }
    }, 1200);
  };

  const renderPart = (part, isEnemy = false) => {
    const idx = BODY_PARTS.indexOf(part);

    const fb = isEnemy
      ? feedback.enemy?.part === part && feedback.enemy.type
      : feedback.player?.part === part && feedback.player.type;

    const selected = isEnemy
      ? playerAttack === part
      : playerDefense === part;

    const click = isEnemy
      ? () => setPlayerAttack(part)
      : () => setPlayerDefense(part);

    return (
      <div
        key={part}
        onClick={click}
        className={`part ${selected ? "selected" : ""} ${fb || ""} ${
          isEnemy ? "enemy-part" : "player-part"
        }`}
        style={{
          top: PART_POSITIONS[part].top,
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: PART_POSITIONS[part].size,
          height: PART_POSITIONS[part].size,
          position: "absolute"
        }}
      >
        <div className="part-inner">
          <img src={[hatImg, jacketImg, beltImg, pantsImg, bootsImg][idx]} />{fb && <img/>}
        </div>
      </div>
    );
  };

  if (view === "home") {
    return (
      <ScreenWrapper title="⚔️ Duel">
        <div style={{ textAlign: "center", marginTop: "60px" }}>
          <br /><br />
          <button className="play-again-btn" onClick={startDuel}>🧠 Play vs AI</button>
          <button className="play-again-btn" onClick={createLobby}>🎯 Create Match</button>
          <br /><br />
          <input
            type="text"
            placeholder="Lobby ID"
            value={joinLobbyId}
            onChange={(e) =>
            setJoinLobbyId(e.target.value)}
          />
          <br /><br />
          <button className="play-again-btn" onClick={joinLobby}>🚪 Join Match</button>
        </div>
      </ScreenWrapper>
    );
  }

  if (view === "lobby") {
    return (
      <ScreenWrapper title="⚔️ Lobby">
        <div style={{ textAlign: "center" }}>
          <h2>Lobby #{roomId}</h2>
          <h3>Expires in {lobbyTimer}s</h3>
          {lobbyPlayers.map(player => (
            <div
              key={player.id}
              style={{
                marginBottom: "10px",
              }}
            >
              {player.username}
              {player.ready
              ? " ✅ Ready"
              : " ⏳ Waiting"}
            </div>
          ))}
          <button
            className="play-again-btn"
            disabled={ready}
            onClick={() => {
              if (ready) return;
              setReady(true);
              socket.emit("ready", roomId);
            }}
          >     
            {ready ? "WAITING..." : "READY"}
          </button>
        </div>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper title="⚔️ Duel">
      <div className="timer">⏱ {timer}s</div>
      <div className="hp-container">
        <div className="hp-bar-player">
          <div className="hp-fill-player" style={{ width: `${(playerHP / playerMaxHP) * 100}%` }}/>
          <span>{playerHP} / {playerMaxHP}</span>
        </div>

        <div className="hp-bar-enemy">
          <div className="hp-fill-enemy" style={{ width: `${(enemyHP / enemyMaxHP) * 100}%` }}/>
          <span>{enemyHP} / {enemyMaxHP}</span>
        </div>
      </div>

      <div className="duel-arena">
        <div className="character">
          <h4>🛡 Defend</h4>
          <div className="body">
            {BODY_PARTS.map(p => renderPart(p, false))}
          </div>
        </div>

        <div className="character">
          <h4>🎯 Attack</h4>
          <div className="body enemy-body">
            {BODY_PARTS.map(p => renderPart(p, true))}
          </div>
        </div>
      </div>

      <div className="duel-log">
        {log.map((l, i) => (
          <div key={i} className={`log-entry log-${l.type}`}>
            {l.text}
          </div>
        ))}
      </div>
      {gameOver && (
        <div className="end-screen">
          <h2>
            {result === "win" && "🏆 VICTORY 🏆"}
            {result === "lose" && "💀 DEFEAT 💀"}
            {result === "tie" && "🤝 DRAW 🤝"}
          </h2>
          <button onClick={() => setView("home")}>
            🏠 Home
          </button>
        </div>
      )}
    </ScreenWrapper>
  ); 
}