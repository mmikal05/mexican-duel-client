import { useCallback, useEffect, useRef, useState } from "react";
import { socket, getPlayerToken } from "../socket";
import { MAX_HP } from "./constants";
import { describeAttack, pushLog, outcomeOf } from "./rules";

const NO_PICK = { attack: null, defense: null };
const enemyOf = (pid) => (pid === "p1" ? "p2" : "p1");

/*
  Everything about online duels lives here: lobby, rounds, reconnecting.
  The server owns the round clock; this hook only displays it and sends picks.
  Picks can be changed freely until the round ends, the latest one counts.
*/
export default function useOnlineDuel({ username, onResult }) {
  const [view, setView] = useState("home"); // "home" | "lobby" | "fight"
  const [error, setError] = useState("");

  // lobby
  const [roomId, setRoomId] = useState(null);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [lobbyEndsAt, setLobbyEndsAt] = useState(null);
  const [ready, setReady] = useState(false);

  // fight
  const [roundEndsAt, setRoundEndsAt] = useState(null);
  const [roundActive, setRoundActive] = useState(false);
  const [status, setStatus] = useState("");
  const [playerHP, setPlayerHP] = useState(MAX_HP);
  const [enemyHP, setEnemyHP] = useState(MAX_HP);
  const [selection, setSelection] = useState(NO_PICK);
  const [feedback, setFeedback] = useState({});
  const [log, setLog] = useState([]);
  const [result, setResult] = useState(null);

  const pidRef = useRef(null); // "p1" / "p2", assigned by the server
  const roomIdRef = useRef(null);
  const roundRef = useRef(0);
  const selectionRef = useRef(NO_PICK);
  const viewRef = useRef("home");
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const applySelection = useCallback((next) => {
    selectionRef.current = next;
    setSelection(next);
  }, []);

  const resetAll = useCallback(() => {
    pidRef.current = null;
    roomIdRef.current = null;
    roundRef.current = 0;
    applySelection(NO_PICK);
    setView("home");
    setRoomId(null);
    setLobbyPlayers([]);
    setLobbyEndsAt(null);
    setReady(false);
    setRoundEndsAt(null);
    setRoundActive(false);
    setStatus("");
    setFeedback({});
    setLog([]);
    setResult(null);
  }, [applySelection]);

  useEffect(() => {
    const token = getPlayerToken();

    // Runs on every (re)connection: if this tab is still seated in a room the
    // server puts us back into it (page refresh, dropped connection, ...).
    const requestReconnect = () => socket.emit("reconnectPlayer", { token });

    const loadFight = (hp) => {
      setPlayerHP(hp[pidRef.current]);
      setEnemyHP(hp[enemyOf(pidRef.current)]);
      setFeedback({});
      setResult(null);
      setStatus("");
    };

    const onMatchCreated = ({ roomId, pid }) => {
      pidRef.current = pid;
      roomIdRef.current = roomId;
      setRoomId(roomId);
      setError("");
      setLobbyPlayers([]);
      setReady(false);
      setView("lobby");
    };

    const onMatchJoined = ({ roomId, pid }) => {
      pidRef.current = pid;
      roomIdRef.current = roomId;
      setRoomId(roomId);
      setError("");
    };

    const onLobby = ({ roomId, players, expiresIn }) => {
      roomIdRef.current = roomId;
      setRoomId(roomId);
      setLobbyPlayers(players);
      setLobbyEndsAt(Date.now() + expiresIn);
      setReady(Boolean(players.find((p) => p.pid === pidRef.current)?.ready));
      setView("lobby");
    };

    const onLobbyError = ({ message }) => setError(message);

    const onLobbyExpired = () => {
      resetAll();
      setError("Lobby expired");
    };

    const onDuelStart = ({ hp }) => {
      loadFight(hp);
      roundRef.current = 0;
      applySelection(NO_PICK);
      setLog(pushLog([], "Duel started!"));
      setRoundActive(false);
      setView("fight");
    };

    const onRoundStart = ({ round, endsIn }) => {
      // The same round number again means "clock resumed", keep the current picks.
      if (round !== roundRef.current) {
        roundRef.current = round;
        applySelection(NO_PICK);
        setFeedback({});
      }
      setStatus("");
      setRoundActive(true);
      setRoundEndsAt(Date.now() + endsIn);
    };

    const onRoundResult = ({ hp, results }) => {
      const me = pidRef.current;
      const foe = enemyOf(me);

      setRoundActive(false);
      setRoundEndsAt(null);
      setPlayerHP(hp[me]);
      setEnemyHP(hp[foe]);

      // player = what hit my body, enemy = what I hit
      setFeedback({
        player: { part: results[foe].attack, type: results[foe].type },
        enemy: { part: results[me].attack, type: results[me].type },
      });
      setLog((prev) =>
        pushLog(
          pushLog(prev, describeAttack("You", results[me]), results[me].type),
          describeAttack("Enemy", results[foe]),
          results[foe].type
        )
      );

      const outcome = outcomeOf(hp[me], hp[foe]);
      if (outcome) {
        setResult(outcome);
        onResultRef.current?.(outcome);
      }
    };

    const onReconnected = ({ roomId, pid, started, players, expiresIn, hp, phase, round, suspended, endsIn, myMove }) => {
      pidRef.current = pid;
      roomIdRef.current = roomId;
      setRoomId(roomId);
      setError("");

      if (!started) {
        setLobbyPlayers(players);
        setLobbyEndsAt(Date.now() + expiresIn);
        setReady(Boolean(players.find((p) => p.pid === pid)?.ready));
        setView("lobby");
        return;
      }

      loadFight(hp);
      roundRef.current = round;
      applySelection(myMove || NO_PICK);
      setLog(pushLog([], "Reconnected"));
      setRoundActive(phase === "round");
      setRoundEndsAt(endsIn != null ? Date.now() + endsIn : null);
      setStatus(suspended ? "Waiting for your opponent to reconnect…" : "");
      setView("fight");
    };

    const onNoActiveMatch = () => {
      // We thought we were in a match, but the server has nothing for us.
      if (viewRef.current !== "home") {
        resetAll();
        setError("The match ended while you were away.");
      }
    };

    const onPlayerDisconnected = () => {
      setStatus("Opponent disconnected. Waiting up to 30s…");
      setRoundEndsAt(null);
    };

    const onPlayerReconnected = () => setStatus("");

    const onOpponentForfeit = () => {
      setRoundActive(false);
      setRoundEndsAt(null);
      setStatus("");
      setResult("win");
    };

    const onSocketDisconnect = () => {
      if (viewRef.current !== "home") {
        setStatus("Connection lost. Reconnecting…");
        setRoundEndsAt(null);
      }
    };

    const handlers = {
      connect: requestReconnect,
      disconnect: onSocketDisconnect,
      matchCreated: onMatchCreated,
      matchJoined: onMatchJoined,
      lobby: onLobby,
      lobbyError: onLobbyError,
      lobbyExpired: onLobbyExpired,
      duelStart: onDuelStart,
      roundStart: onRoundStart,
      roundResult: onRoundResult,
      reconnected: onReconnected,
      noActiveMatch: onNoActiveMatch,
      playerDisconnected: onPlayerDisconnected,
      playerReconnected: onPlayerReconnected,
      opponentForfeit: onOpponentForfeit,
    };

    Object.entries(handlers).forEach(([event, fn]) => socket.on(event, fn));

    if (socket.connected) requestReconnect();
    else socket.connect();

    return () => {
      Object.entries(handlers).forEach(([event, fn]) => socket.off(event, fn));
    };
  }, [applySelection, resetAll]);

  const createLobby = () => {
    setError("");
    socket.emit("createLobby", { username, token: getPlayerToken() });
  };

  const joinLobby = (id) => {
    if (!id.trim()) {
      setError("Enter a Lobby ID");
      return;
    }
    setError("");
    socket.emit("joinMatch", { roomId: id.trim(), username, token: getPlayerToken() });
  };

  const readyUp = () => {
    setReady(true);
    socket.emit("ready", roomIdRef.current);
  };

  const pick = (kind, part) => {
    if (!roundActive || result) return;
    const next = { ...selectionRef.current, [kind]: part };
    applySelection(next);
    socket.emit("move", { roomId: roomIdRef.current, round: roundRef.current, ...next });
  };

  return {
    view,
    error,
    createLobby,
    joinLobby,
    readyUp,
    pick,
    leave: resetAll,
    lobby: { roomId, players: lobbyPlayers, endsAt: lobbyEndsAt, ready },
    fight: { roundEndsAt, roundActive, status, playerHP, enemyHP, selection, feedback, log, result },
  };
}
