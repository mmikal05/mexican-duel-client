import { XP_AI, WAGER_FEE_RATE } from "./constants";

// Same base rules as the server (resolve() in server/index.js). No gear or
// skills: both sides always fight with identical stats.
export function resolveAttack(attack, targetDefense, random = Math.random) {
  if (!attack) return { damage: 0, type: "miss", attack: null };
  if (attack === targetDefense) return { damage: 5, type: "block", attack };
  if (random() < 0.2) return { damage: 20, type: "crit", attack };
  return { damage: 10, type: "hit", attack };
}

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

/* ---------- per-match statistics (shown on the end screen) ---------- */

export const emptyStats = () => ({ rounds: 0, dealt: 0, taken: 0, crits: 0, blocked: 0 });

// mine / theirs: the resolved attack results for this round
export const addRoundStats = (stats, mine, theirs) => ({
  rounds: stats.rounds + 1,
  dealt: stats.dealt + mine.damage,
  taken: stats.taken + theirs.damage,
  crits: stats.crits + (mine.type === "crit" ? 1 : 0),
  blocked: stats.blocked + (theirs.type === "block" ? 1 : 0),
});

/* ---------- rewards ---------- */

// EXP for a practice match. (Online EXP and payouts are decided by the server.)
export const aiExpFor = (result) => XP_AI[result] ?? 0;

// What a wager means, for the texts shown before a duel. The server does the real
// bookkeeping: both stake `wager`, the winner gets the pot minus the fee.
export function wagerBreakdown(wager) {
  const pot = wager * 2;
  const fee = Math.round(pot * WAGER_FEE_RATE);
  return { pot, fee, winnerGets: pot - fee };
}
