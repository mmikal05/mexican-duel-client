import { useEffect } from "react";
import ScreenWrapper from "../components/ScreenWrapper";
import { useGame } from "../context/GameContext";
import useOnlineDuel from "../duel/useOnlineDuel";
import useAIDuel from "../duel/useAIDuel";
import { setMatchLocked } from "../duel/matchLock";
import { playerName } from "../playerName";
import HomeView from "../duel/HomeView";
import LobbyView from "../duel/LobbyView";
import FightView from "../duel/FightView";
import EndScreen from "../duel/EndScreen";

export default function Duel() {
  const {
    user,
    player,
    setExp,
    aiModel,
    setAiModel,
    stakeCoins,
    settleCoins,
    recordDuel,
    playerStats,
    setDuelCoins,
  } = useGame();

  // One place applies everything a finished duel changes.
  const applyResult = (summary) => {
    if (summary.expGain > 0) setExp((prev) => prev + summary.expGain);

    if (summary.mode === "online") {
      if (summary.staked) settleCoins(summary.roomId, summary.payout);
      if (summary.result !== "void") {
        recordDuel({ mode: "online", result: summary.result, coinNet: summary.coinNet });
      }
      if (summary.result === "win") setDuelCoins((prev) => prev + 1);
    } else {
      recordDuel({ mode: "ai", result: summary.result });
    }
  };

  const online = useOnlineDuel({
    username: playerName(user.email),
    wallet: { coins: player.coins, escrow: player.escrow, stake: stakeCoins },
    onFinish: applyResult,
  });

  const ai = useAIDuel({ model: aiModel, setModel: setAiModel, onFinish: applyResult, playerStats });

  // While a duel is running, keep the player from wandering off through the nav.
  const inMatch =
    (online.view === "fight" && !online.summary) || (ai.active && !ai.summary);
  useEffect(() => {
    setMatchLocked(inMatch);
    return () => setMatchLocked(false);
  }, [inMatch]);

  /* ---------- what to show ---------- */

  if (online.summary) {
    const rematch = online.summary.result !== "void"
      ? () => { online.leave(); online.createLobby(online.summary.wager); }
      : null;
    return <EndScreen summary={online.summary} onClose={online.leave} onPlayAgain={rematch} />;
  }

  if (ai.summary) {
    return <EndScreen summary={ai.summary} onClose={ai.exit} onPlayAgain={ai.start} />;
  }

  if (online.view === "lobby") {
    return (
      <ScreenWrapper title="⚔️ Lobby">
        <LobbyView
          {...online.lobby}
          coins={player.coins}
          onReady={online.readyUp}
          onUnready={online.unready}
          onLeave={online.leaveLobby}
          onEmote={online.sendEmote}
        />
      </ScreenWrapper>
    );
  }

  if (online.view === "fight") {
    return (
      <ScreenWrapper title="⚔️ Duel">
        <FightView
          mode="online"
          {...online.fight}
          onPick={online.pick}
          onLock={online.lock}
          onLeave={online.forfeit}
          onEmote={online.sendEmote}
        />
      </ScreenWrapper>
    );
  }

  if (ai.active) {
    return (
      <ScreenWrapper title="🧠 Practice">
        <FightView
          mode="ai"
          {...ai.fight}
          playerMaxHp={playerStats.maxHp}
          myName="You"
          foeName="AI"
          onPick={ai.pick}
          onLock={ai.lock}
          onLeave={ai.exit}
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper title="⚔️ Duel">
      <HomeView
        coins={player.coins}
        aiModel={aiModel}
        error={online.error}
        openLobbies={online.openLobbies}
        onPlayAI={ai.start}
        onCreate={online.createLobby}
        onJoin={online.joinLobby}
      />
    </ScreenWrapper>
  );
}
