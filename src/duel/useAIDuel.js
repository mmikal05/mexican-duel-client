import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_HP, ROUND_TIME, BETWEEN_ROUNDS_MS } from "./constants";
import {
  resolveAttack,
  describeAttack,
  pushLog,
  outcomeOf,
  emptyStats,
  addRoundStats,
  aiExpFor,
} from "./rules";
import { chooseMove, learn } from "./aiBrain";

const NO_PICK = { attack: null, defense: null };
const pct = (x) => `${Math.round(x * 100)}%`;

/*
  Practice match against the learning AI (see aiBrain.js).
  No gear, no skills, no wager. It only pays a little EXP.

  The AI studies the player's picks after every round and the model is stored
  in the player's profile (model / setModel), so it keeps learning across matches.
*/
export default function useAIDuel({ model, setModel, onFinish }) {
  const [active, setActive] = useState(false);
  const [round, setRound] = useState(0);
  const [roundEndsAt, setRoundEndsAt] = useState(null);
  const [roundActive, setRoundActive] = useState(false);
  const [playerHP, setPlayerHP] = useState(MAX_HP);
  const [enemyHP, setEnemyHP] = useState(MAX_HP);
  const [selection, setSelection] = useState(NO_PICK);
  const [feedback, setFeedback] = useState({});
  const [log, setLog] = useState([]);
  const [status, setStatus] = useState("");
  const [summary, setSummary] = useState(null);

  // Refs let the round timer read the latest picks/HP without stale closures.
  const selectionRef = useRef(NO_PICK);
  const hpRef = useRef({ player: MAX_HP, enemy: MAX_HP });
  const statsRef = useRef(emptyStats());
  const guardedRef = useRef(0); // rounds where the AI guessed the player's attack
  const modelRef = useRef(model);
  const onFinishRef = useRef(onFinish);
  const pauseTimer = useRef(null);
  const endTimer = useRef(null);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  // Only adopt the stored model when no match is running (it changes every round while playing).
  useEffect(() => {
    if (!active) modelRef.current = model;
  }, [model, active]);

  const startRound = useCallback(() => {
    selectionRef.current = NO_PICK;
    setSelection(NO_PICK);
    setFeedback({});
    setStatus("");
    setRound((r) => r + 1);
    setRoundActive(true);
    setRoundEndsAt(Date.now() + ROUND_TIME * 1000);
  }, []);

  const resolveRound = useCallback(() => {
    const mine = selectionRef.current;

    // The AI decides from what it has learned so far. It never sees this round's picks.
    const ai = chooseMove(modelRef.current);

    const myResult = resolveAttack(mine.attack, ai.defense);
    const aiResult = resolveAttack(ai.attack, mine.defense);

    const player = Math.max(hpRef.current.player - aiResult.damage, 0);
    const foe = Math.max(hpRef.current.enemy - myResult.damage, 0);
    hpRef.current = { player, enemy: foe };
    statsRef.current = addRoundStats(statsRef.current, myResult, aiResult);

    // ...and only now learns from what the player actually did.
    modelRef.current = learn(modelRef.current, mine);
    setModel(modelRef.current);

    const read = mine.attack && ai.expected.attack === mine.attack;
    if (ai.defense === mine.attack) guardedRef.current += 1;

    setPlayerHP(player);
    setEnemyHP(foe);
    setRoundActive(false);
    setRoundEndsAt(null);
    setFeedback({
      player: { part: aiResult.attack, type: aiResult.type },
      enemy: { part: myResult.attack, type: myResult.type },
    });
    setStatus(
      `🧠 AI expected your attack on ${ai.expected.attack} (${pct(ai.expected.chance)}) — ${
        read ? "it read you" : "wrong guess"
      }`
    );
    setLog((prev) =>
      pushLog(
        pushLog(prev, describeAttack("You", myResult), myResult.type),
        describeAttack("AI", aiResult),
        aiResult.type
      )
    );

    const outcome = outcomeOf(player, foe);
    if (!outcome) {
      pauseTimer.current = setTimeout(startRound, BETWEEN_ROUNDS_MS);
      return;
    }

    const result = {
      mode: "ai",
      result: outcome,
      reason: "ko",
      wager: 0,
      payout: 0,
      expGain: aiExpFor(outcome),
      stats: statsRef.current,
      aiStudied: modelRef.current.rounds,
      aiGuarded: guardedRef.current,
    };
    onFinishRef.current?.(result); // rewards are applied right away
    endTimer.current = setTimeout(() => setSummary(result), 1300); // let the last hit land first
  }, [setModel, startRound]);

  // The round ends when its countdown does (or sooner if the player locks in).
  useEffect(() => {
    if (!roundEndsAt) return;
    const id = setTimeout(resolveRound, Math.max(0, roundEndsAt - Date.now()));
    return () => clearTimeout(id);
  }, [roundEndsAt, resolveRound]);

  useEffect(
    () => () => {
      clearTimeout(pauseTimer.current);
      clearTimeout(endTimer.current);
    },
    []
  );

  const start = () => {
    clearTimeout(pauseTimer.current);
    clearTimeout(endTimer.current);
    modelRef.current = model;
    hpRef.current = { player: MAX_HP, enemy: MAX_HP };
    statsRef.current = emptyStats();
    guardedRef.current = 0;
    setPlayerHP(MAX_HP);
    setEnemyHP(MAX_HP);
    setLog([]);
    setSummary(null);
    setRound(0);
    setActive(true);
    startRound();
  };

  // Leave the match (also used to close the end screen). Quitting early earns nothing.
  const exit = () => {
    clearTimeout(pauseTimer.current);
    clearTimeout(endTimer.current);
    setActive(false);
    setSummary(null);
    setRoundActive(false);
    setRoundEndsAt(null);
  };

  const pick = (kind, part) => {
    if (!roundActive) return;
    selectionRef.current = { ...selectionRef.current, [kind]: part };
    setSelection(selectionRef.current);
  };

  // Lock in: nothing to wait for, the AI answers immediately.
  const lock = () => {
    const s = selectionRef.current;
    if (!roundActive || !s.attack || !s.defense) return;
    resolveRound();
  };

  return {
    active,
    summary,
    start,
    exit,
    pick,
    lock,
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
      lockedMe: false,
      lockedFoe: false,
    },
  };
}
