import { useCallback, useEffect, useRef, useState } from "react";
import { socket, getPlayerToken } from "../socket";
import { MAX_HP } from "./constants";
import { describeAttack, pushLog, emptyStats } from "./rules";

const NO_PICK = { attack: null, defense: null };
const enemyOf = (pid) => (pid === "p1" ? "p2" : "p1");

// Remember which matches were already paid out, so a replayed result can never pay twice.
const SETTLED_KEY = "duelSettled";
const wasSettled = (roomId) => {
  try {
    return JSON.parse(localStorage.getItem(SETTLED_KEY) || "[]").includes(roomId);
  } catch {
    return false;
  }
};
const markSettled = (roomId) => {
  try {
    const list = JSON.parse(localStorage.getItem(SETTLED_KEY) || "[]");
    localStorage.setItem(SETTLED_KEY, JSON.stringify([...list, roomId].slice(-30)));
  } catch {
    /* storage unavailable: the server-side acknowledgement still protects us */
  }
};

/*
  Everything about online duels lives here: lobby, wagers, rounds, reconnecting.

  The server owns the round clock and decides the winner; this hook displays
  it and sends picks. Wagers: the stake is taken from the wallet when the duel
  starts and the payout is applied when the server reports the result.

  wallet:   { coins, escrow, stake(roomId, amount) }
  onFinish: called once per finished duel with the summary (Duel.jsx applies
            EXP, coins and the win/loss record).
*/
export default function useOnlineDuel({ username, wallet, onFinish }) {
  const [view, setView] = useState("home"); // "home" | "lobby" | "fight"
  const [error, setError] = useState("");
  const [openLobbies, setOpenLobbies] = useState([]);

  // lobby
  const [roomId, setRoomId] = useState(null);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [lobbyEndsAt, setLobbyEndsAt] = useState(null);
  const [lobbyTtl, setLobbyTtl] = useState(0);
  const [wager, setWager] = useState(0);
  const [ready, setReady] = useState(false);

  // fight
  const [round, setRound] = useState(0);
  const [roundEndsAt, setRoundEndsAt] = useState(null);
  const [roundActive, setRoundActive] = useState(false);
  const [status, setStatus] = useState("");
  const [playerHP, setPlayerHP] = useState(MAX_HP);
  const [enemyHP, setEnemyHP] = useState(MAX_HP);
  const [selection, setSelection] = useState(NO_PICK);
  const [feedback, setFeedback] = useState({});
  const [log, setLog] = useState([]);
  const [lockedMe, setLockedMe] = useState(false);
  const [lockedFoe, setLockedFoe] = useState(false);
  const [emotes, setEmotes] = useState({ me: null, foe: null });
  const [summary, setSummary] = useState(null);

  const pidRef = useRef(null); // "p1" / "p2", assigned by the server
  const roomIdRef = useRef(null);
  const wagerRef = useRef(0);
  const playersRef = useRef([]);
  const roundRef = useRef(0);
  const selectionRef = useRef(NO_PICK);
  const viewRef = useRef("home");
  const walletRef = useRef(wallet);
  const onFinishRef = useRef(onFinish);
  const summaryTimer = useRef(null);
  const emoteTimers = useRef({});

  useEffect(() => {
    walletRef.current = wallet;
    onFinishRef.current = onFinish;
  });

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const applySelection = useCallback((next) => {
    selectionRef.current = next;
    setSelection(next);
  }, []);

  const resetAll = useCallback(() => {
    clearTimeout(summaryTimer.current);
    pidRef.current = null;
    roomIdRef.current = null;
    wagerRef.current = 0;
    playersRef.current = [];
    roundRef.current = 0;
    applySelection(NO_PICK);
    setView("home");
    setRoomId(null);
    setLobbyPlayers([]);
    setLobbyEndsAt(null);
    setWager(0);
    setReady(false);
    setRound(0);
    setRoundEndsAt(null);
    setRoundActive(false);
    setStatus("");
    setFeedback({});
    setLog([]);
    setLockedMe(false);
    setLockedFoe(false);
    setEmotes({ me: null, foe: null });
    setSummary(null);
  }, [applySelection]);

  useEffect(() => {
    const token = getPlayerToken();

    // Runs on every (re)connection: if this tab is still seated in a room the
    // server puts us back into it (page refresh, dropped connection, ...).
    const requestReconnect = () => socket.emit("reconnectPlayer", { token });

    const opponentName = () =>
      playersRef.current.find((p) => p.pid === enemyOf(pidRef.current))?.username ?? "Opponent";

    const loadFight = (hp) => {
      setPlayerHP(hp[pidRef.current]);
      setEnemyHP(hp[enemyOf(pidRef.current)]);
      setFeedback({});
      setStatus("");
    };

    // Take the stake if we haven't already. Returns false if the player can't cover it.
    const ensureStake = (id, amount) => {
      if (amount <= 0) return true;
      const w = walletRef.current;
      if (w.escrow?.roomId === id) return true;
      if (w.coins < amount || w.escrow) {
        socket.emit("stakeFailed", id);
        return false;
      }
      w.stake(id, amount);
      return true;
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

    const onLobby = ({ roomId, players, wager, ttl, expiresIn }) => {
      roomIdRef.current = roomId;
      playersRef.current = players;
      wagerRef.current = wager;
      setRoomId(roomId);
      setLobbyPlayers(players);
      setWager(wager);
      setLobbyTtl(ttl);
      setLobbyEndsAt(Date.now() + expiresIn);
      setReady(Boolean(players.find((p) => p.pid === pidRef.current)?.ready));
      setView("lobby");
    };

    const onLobbyError = ({ message }) => setError(message);

    const onLobbiesList = (list) => setOpenLobbies(list);

    const onLobbyExpired = () => {
      resetAll();
      setError("Your lobby expired");
    };

    const onLeftLobby = () => resetAll();

    const onDuelStart = ({ hp, wager, players }) => {
      playersRef.current = players;
      wagerRef.current = wager;
      setWager(wager);
      setLobbyPlayers(players);
      roundRef.current = 0;
      setRound(0);
      applySelection(NO_PICK);
      setLockedMe(false);
      setLockedFoe(false);
      loadFight(hp);
      setLog(pushLog([], "Duel started!"));
      setRoundActive(false);
      setView("fight");

      if (!ensureStake(roomIdRef.current, wager)) {
        setStatus("You can't cover the wager. Cancelling…");
      }
    };

    const onRoundStart = ({ round, endsIn }) => {
      // The same round number again means "clock resumed": keep picks and locks.
      if (round !== roundRef.current) {
        roundRef.current = round;
        setRound(round);
        applySelection(NO_PICK);
        setLockedMe(false);
        setLockedFoe(false);
        setFeedback({});
      }
      setStatus("");
      setRoundActive(true);
      setRoundEndsAt(Date.now() + endsIn);
    };

    const onLocked = ({ pid }) => {
      if (pid === pidRef.current) setLockedMe(true);
      else setLockedFoe(true);
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
          describeAttack(opponentName(), results[foe]),
          results[foe].type
        )
      );
    };

    const onMatchOver = (m) => {
      socket.emit("ackMatchOver", { token, roomId: m.roomId });
      if (wasSettled(m.roomId)) return; // already paid out on an earlier delivery
      markSettled(m.roomId);

      // The server worked out the payout and EXP; we only pay coins if we really staked them.
      const staked = walletRef.current.escrow?.roomId === m.roomId;
      const payout = staked ? m.payout : 0;

      const result = {
        roomId: m.roomId,
        mode: "online",
        result: m.result,
        reason: m.reason,
        wager: m.wager,
        fee: m.fee,
        staked,
        payout,
        coinNet: staked ? payout - m.wager : 0,
        expGain: m.expGain,
        expDetail: m.expDetail,
        stats: m.stats ?? emptyStats(),
        opponent: m.opponent || opponentName(),
      };

      onFinishRef.current?.(result);

      setRoundActive(false);
      setRoundEndsAt(null);
      setStatus("");

      // After a knockout, let the last hit land before covering the screen.
      const delay = m.reason === "ko" && viewRef.current === "fight" ? 1400 : 0;
      clearTimeout(summaryTimer.current);
      summaryTimer.current = setTimeout(() => setSummary(result), delay);
    };

    const onReconnected = ({ roomId, pid, started, players, wager, ttl, expiresIn, hp, phase, round, suspended, endsIn, myMove, locked }) => {
      pidRef.current = pid;
      roomIdRef.current = roomId;
      playersRef.current = players;
      wagerRef.current = wager;
      setRoomId(roomId);
      setLobbyPlayers(players);
      setWager(wager);
      setError("");

      if (!started) {
        setLobbyTtl(ttl);
        setLobbyEndsAt(Date.now() + expiresIn);
        setReady(Boolean(players.find((p) => p.pid === pid)?.ready));
        setView("lobby");
        return;
      }

      ensureStake(roomId, wager);
      loadFight(hp);
      roundRef.current = round;
      setRound(round);
      applySelection(myMove || NO_PICK);
      setLockedMe(Boolean(locked[pid]));
      setLockedFoe(Boolean(locked[enemyOf(pid)]));
      setLog(pushLog([], "Reconnected"));
      setRoundActive(phase === "round");
      setRoundEndsAt(endsIn != null ? Date.now() + endsIn : null);
      setStatus(suspended ? "Waiting for your opponent to reconnect…" : "");
      setView("fight");
    };

    const onNoActiveMatch = () => {
      // Nothing on the server for us. If we were holding a stake for a duel the
      // server has forgotten (e.g. it restarted), give it back.
      const w = walletRef.current;
      if (w.escrow) {
        markSettled(w.escrow.roomId);
        onFinishRef.current?.({
          roomId: w.escrow.roomId,
          mode: "online",
          result: "void",
          reason: "lost",
          wager: w.escrow.amount,
          staked: true,
          payout: w.escrow.amount,
          coinNet: 0,
          expGain: 0,
          stats: emptyStats(),
          opponent: "",
        });
      }

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

    const showEmote = (who, emote) => {
      clearTimeout(emoteTimers.current[who]);
      setEmotes((prev) => ({ ...prev, [who]: { emote, id: Date.now() } }));
      emoteTimers.current[who] = setTimeout(
        () => setEmotes((prev) => ({ ...prev, [who]: null })),
        2500
      );
    };

    const onEmote = ({ pid, emote }) => showEmote(pid === pidRef.current ? "me" : "foe", emote);

    const onSocketDisconnect = () => {
      if (viewRef.current === "fight") {
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
      lobbiesList: onLobbiesList,
      lobbyExpired: onLobbyExpired,
      leftLobby: onLeftLobby,
      duelStart: onDuelStart,
      roundStart: onRoundStart,
      roundResult: onRoundResult,
      locked: onLocked,
      matchOver: onMatchOver,
      reconnected: onReconnected,
      noActiveMatch: onNoActiveMatch,
      playerDisconnected: onPlayerDisconnected,
      playerReconnected: onPlayerReconnected,
      emote: onEmote,
    };

    Object.entries(handlers).forEach(([event, fn]) => socket.on(event, fn));

    if (socket.connected) requestReconnect();
    else socket.connect();

    const timers = emoteTimers.current;
    return () => {
      Object.entries(handlers).forEach(([event, fn]) => socket.off(event, fn));
      Object.values(timers).forEach(clearTimeout);
      clearTimeout(summaryTimer.current);
    };
  }, [applySelection, resetAll]);

  // Keep the list of open lobbies fresh while the player is browsing the menu.
  useEffect(() => {
    if (view !== "home") return;

    const refresh = () => socket.emit("getLobbies");
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [view]);

  /* ---------- actions ---------- */

  const createLobby = (amount) => {
    if (amount > wallet.coins) {
      setError("You don't have enough coins for that wager");
      return;
    }
    setError("");
    socket.emit("createLobby", { username, token: getPlayerToken(), wager: amount });
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

  const unready = () => {
    setReady(false);
    socket.emit("unready", roomIdRef.current);
  };

  const leaveLobby = () => {
    socket.emit("leaveLobby", roomIdRef.current);
    resetAll();
  };

  const pick = (kind, part) => {
    if (!roundActive || lockedMe || summary) return;
    const next = { ...selectionRef.current, [kind]: part };
    applySelection(next);
    socket.emit("move", { roomId: roomIdRef.current, round: roundRef.current, ...next });
  };

  const lock = () => {
    const s = selectionRef.current;
    if (!roundActive || lockedMe || !s.attack || !s.defense) return;
    setLockedMe(true);
    socket.emit("lock", { roomId: roomIdRef.current, round: roundRef.current });
  };

  const forfeit = () => socket.emit("forfeit", roomIdRef.current);

  const sendEmote = (emote) => socket.emit("emote", { roomId: roomIdRef.current, emote });

  const me = lobbyPlayers.find((p) => p.pid === pidRef.current);
  const foe = lobbyPlayers.find((p) => p.pid === enemyOf(pidRef.current));

  return {
    view,
    error,
    summary,
    openLobbies,
    createLobby,
    joinLobby,
    readyUp,
    unready,
    leaveLobby,
    pick,
    lock,
    forfeit,
    sendEmote,
    leave: resetAll,
    dismissError: () => setError(""),
    lobby: {
      roomId,
      players: lobbyPlayers,
      myPid: pidRef.current,
      endsAt: lobbyEndsAt,
      ttl: lobbyTtl,
      wager,
      ready,
      emotes,
    },
    fight: {
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
      wager,
      myName: me?.username ?? username,
      foeName: foe?.username ?? "Opponent",
      emotes,
    },
  };
}
