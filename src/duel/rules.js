import { BODY_PARTS } from "./constants";

// Same base rules as the server (resolve() in server/index.js). No gear or
// skills: both sides always fight with identical stats.
export function resolveAttack(attack, targetDefense, random = Math.random) {
  if (!attack) return { damage: 0, type: "miss", attack: null };
  if (attack === targetDefense) return { damage: 5, type: "block", attack };
  if (random() < 0.2) return { damage: 20, type: "crit", attack };
  return { damage: 10, type: "hit", attack };
}

const randomPart = () => BODY_PARTS[Math.floor(Math.random() * BODY_PARTS.length)];

export const randomPick = () => ({ attack: randomPart(), defense: randomPart() });

export const describeAttack = (who, r) =>
  r.attack
    ? `${who} hit ${r.attack} → ${r.type.toUpperCase()} (${r.damage})`
    : `${who} did not attack → MISS`;

// newest first, capped so the log never grows forever
export const pushLog = (log, text, type = "") => [{ text, type }, ...log].slice(0, 10);

export const outcomeOf = (myHP, enemyHP) => {
  if (myHP > 0 && enemyHP > 0) return null;
  if (myHP <= 0 && enemyHP <= 0) return "tie";
  return enemyHP <= 0 ? "win" : "lose";
};
