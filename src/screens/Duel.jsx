import { useState } from "react";
import ScreenWrapper from "../components/ScreenWrapper";
import { useGame } from "../context/GameContext";
import "../styles/duel.css";
import useOnlineDuel from "../duel/useOnlineDuel";
import useAIDuel from "../duel/useAIDuel";
import FightView from "../duel/FightView";
import LobbyView from "../duel/LobbyView";
import { XP_REWARD } from "../duel/constants";

export default function Duel() {
  const { user, setExp } = useGame();
  const [joinId, setJoinId] = useState("");

  const online = useOnlineDuel({
    username: user.email,
    onResult: (result) => setExp((prev) => prev + XP_REWARD[result]),
  });
  const ai = useAIDuel();

  if (online.view === "lobby") {
    return (
      <ScreenWrapper title="⚔️ Lobby">
        <LobbyView {...online.lobby} onReady={online.readyUp} />
      </ScreenWrapper>
    );
  }

  if (online.view === "fight") {
    return (
      <ScreenWrapper title="⚔️ Duel">
        <FightView {...online.fight} onPick={online.pick} onExit={online.leave} />
      </ScreenWrapper>
    );
  }

  if (ai.active) {
    return (
      <ScreenWrapper title="⚔️ Duel vs AI">
        <FightView {...ai.fight} onPick={ai.pick} onExit={ai.exit} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper title="⚔️ Duel">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          marginTop: "60px",
        }}
      >
        {online.error && <div style={{ color: "#ff6b6b" }}>{online.error}</div>}

        <button className="play-again-btn" onClick={ai.start}>
          🧠 Play vs AI
        </button>

        <button className="play-again-btn" onClick={online.createLobby}>
          🎯 Create Match
        </button>

        <input
          type="text"
          placeholder="Lobby ID"
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
        />

        <button className="play-again-btn" onClick={() => online.joinLobby(joinId)}>
          🚪 Join Match
        </button>
      </div>
    </ScreenWrapper>
  );
}
