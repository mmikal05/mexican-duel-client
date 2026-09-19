import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_HP, ROUND_TIME, BETWEEN_ROUNDS_MS } from "./constants";
import { resolveAttack, randomPick, describeAttack, pushLog, outcomeOf } from "./rules";

const NO_PICK = { attack: null, defense: null };

// Local practice match against a random opponent.
// No gear, no skills, no rewards: both sides use the base rules only.
export default function useAIDuel() {
  const [active, setActive] = useState(false);
  const [roundEndsAt, setRoundEndsAt] = useState(null);
  const [roundActive, setRoundActive] = useState(false);
  const [playerHP, setPlayerHP] = useState(MAX_HP);
  const [enemyHP, setEnemyHP] = useState(MAX_HP);
  const [selection, setSelection] = useState(NO_PICK);
  const [feedback, setFeedback] = useState({});
  const [log, setLog] = useState([]);
  const [result, setResult] = useState(null);

  // Refs let the round timer read the latest picks/HP without stale closures.
  const selectionRef = useRef(NO_PICK);
  const hpRef = useRef({ player: MAX_HP, enemy: MAX_HP });
  const pauseTimer = useRef(null);

  const startRound = useCallback(() => {
    selectionRef.current = NO_PICK;
    setSelection(NO_PICK);
    setFeedback({});
    setRoundActive(true);
    setRoundEndsAt(Date.now() + ROUND_TIME * 1000);
  }, []);

  const resolveRound = useCallback(() => {
    const mine = selectionRef.current;
    const enemy = randomPick();

    const myResult = resolveAttack(mine.attack, enemy.defense);
    const enemyResult = resolveAttack(enemy.attack, mine.defense);

    const player = Math.max(hpRef.current.player - enemyResult.damage, 0);
    const foe = Math.max(hpRef.current.enemy - myResult.damage, 0);
    hpRef.current = { player, enemy: foe };

    setPlayerHP(player);
    setEnemyHP(foe);
    setRoundActive(false);
    setRoundEndsAt(null);
    setFeedback({
      player: { part: enemyResult.attack, type: enemyResult.type },
      enemy: { part: myResult.attack, type: myResult.type },
    });
    setLog((prev) =>
      pushLog(
        pushLog(prev, describeAttack("You", myResult), myResult.type),
        describeAttack("Enemy", enemyResult),
        enemyResult.type
      )
    );

    const outcome = outcomeOf(player, foe);
    if (outcome) {
      setResult(outcome);
      return;
    }

    pauseTimer.current = setTimeout(startRound, BETWEEN_ROUNDS_MS);
  }, [startRound]);

  // The round ends when its countdown does.
  useEffect(() => {
    if (!roundEndsAt) return;
    const id = setTimeout(resolveRound, Math.max(0, roundEndsAt - Date.now()));
    return () => clearTimeout(id);
  }, [roundEndsAt, resolveRound]);

  useEffect(() => () => clearTimeout(pauseTimer.current), []);

  const start = () => {
    clearTimeout(pauseTimer.current);
    hpRef.current = { player: MAX_HP, enemy: MAX_HP };
    setPlayerHP(MAX_HP);
    setEnemyHP(MAX_HP);
    setLog([]);
    setResult(null);
    setActive(true);
    startRound();
  };

  const exit = () => {
    clearTimeout(pauseTimer.current);
    setActive(false);
    setRoundActive(false);
    setRoundEndsAt(null);
  };

  const pick = (kind, part) => {
    if (!roundActive) return;
    selectionRef.current = { ...selectionRef.current, [kind]: part };
    setSelection(selectionRef.current);
  };

  return {
    active,
    start,
    exit,
    pick,
    fight: { roundEndsAt, roundActive, status: "", playerHP, enemyHP, selection, feedback, log, result },
  };
}
