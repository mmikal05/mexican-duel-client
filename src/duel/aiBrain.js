import { BODY_PARTS } from "./constants";

/*
  The vs-AI opponent. It learns from every round the player plays.

  It keeps a small statistical model of the player:
    - how often they attack / defend each zone (recent rounds count more)
    - what they tend to do NEXT after their previous attack / defense (patterns)
  and turns that into predictions:
    - defense: guard the zone it expects the player to attack
    - attack:  hit a zone it expects the player NOT to be guarding

  With no data it plays uniformly at random, and it gets sharper as it sees
  more rounds (the "learning curve"). It never sees the player's current pick,
  and it keeps a little randomness so it can't be read perfectly. A player who
  picks zones at random can't be exploited (it will block ~20% like anyone).

  The model is plain JSON with flat arrays only (Firestore does not allow
  nested arrays), so it can be saved with the player's profile and keeps
  learning across matches. It uses no gear or skills: it is just a picker.
*/

const N = BODY_PARTS.length;
const DECAY = 0.96; // older observations fade, so the AI adapts if the player changes habits
const SMOOTHING = 1; // pseudo-count so unseen zones keep some probability
const CONFIDENCE_HALF = 12; // rounds needed for the AI to be "half sure" of what it has learned
const EXPLORE = 0.08; // chance-weight of pure randomness kept at all times

const zeros = (n) => Array(n).fill(0);
const idx = (zone) => BODY_PARTS.indexOf(zone);

export const createModel = () => ({
  version: 1,
  rounds: 0,
  attack: zeros(N), // player's attack zone frequencies
  defense: zeros(N), // player's defense zone frequencies
  attackAfter: zeros(N * N), // attackAfter[prev * N + next]
  defenseAfter: zeros(N * N),
  lastAttack: null,
  lastDefense: null,
});

const validArray = (arr, len) =>
  Array.isArray(arr) && arr.length === len && arr.every((v) => Number.isFinite(v) && v >= 0);

const validLast = (v) => v === null || (Number.isInteger(v) && v >= 0 && v < N);

// Accepts whatever came back from storage; anything malformed becomes a fresh model.
export function sanitizeModel(raw) {
  if (
    !raw ||
    !validArray(raw.attack, N) ||
    !validArray(raw.defense, N) ||
    !validArray(raw.attackAfter, N * N) ||
    !validArray(raw.defenseAfter, N * N) ||
    !validLast(raw.lastAttack ?? null) ||
    !validLast(raw.lastDefense ?? null) ||
    !Number.isFinite(raw.rounds)
  ) {
    return createModel();
  }
  return { ...createModel(), ...raw, lastAttack: raw.lastAttack ?? null, lastDefense: raw.lastDefense ?? null };
}

const decayAll = (arr) => arr.map((v) => v * DECAY);

// Record one round of the player's picks (either may be missing if they ran out of time).
export function learn(model, pick) {
  const a = pick.attack ? idx(pick.attack) : -1;
  const d = pick.defense ? idx(pick.defense) : -1;

  let attack = decayAll(model.attack);
  let defense = decayAll(model.defense);
  let attackAfter = decayAll(model.attackAfter);
  let defenseAfter = decayAll(model.defenseAfter);

  if (a >= 0) {
    attack[a] += 1;
    if (model.lastAttack !== null) attackAfter[model.lastAttack * N + a] += 1;
  }
  if (d >= 0) {
    defense[d] += 1;
    if (model.lastDefense !== null) defenseAfter[model.lastDefense * N + d] += 1;
  }

  return {
    ...model,
    rounds: model.rounds + 1,
    attack,
    defense,
    attackAfter,
    defenseAfter,
    lastAttack: a >= 0 ? a : model.lastAttack,
    lastDefense: d >= 0 ? d : model.lastDefense,
  };
}

const normalize = (arr) => {
  const sum = arr.reduce((s, v) => s + v, 0);
  return arr.map((v) => v / sum);
};

const smoothed = (counts) => normalize(counts.map((c) => c + SMOOTHING));

// Probability of each zone being the player's next pick, mixing overall
// habit with "what do they usually do after their last pick?".
function predict(freq, after, last) {
  const base = smoothed(freq);
  if (last === null) return base;

  const row = after.slice(last * N, last * N + N);
  const rowTotal = row.reduce((s, v) => s + v, 0);
  const trust = 0.7 * (rowTotal / (rowTotal + 3)); // pattern only counts once seen a few times
  const patterned = smoothed(row);

  return normalize(base.map((p, i) => (1 - trust) * p + trust * patterned[i]));
}

// 0 (knows nothing) -> 1 (has seen a lot). Drives how sharp the AI's choices are.
export const confidenceOf = (model) => model.rounds / (model.rounds + CONFIDENCE_HALF);

const sharpen = (probs, gamma) => normalize(probs.map((p) => Math.pow(p, gamma)));

const withExploration = (probs) => probs.map((p) => (1 - EXPLORE) * p + EXPLORE / N);

function sample(probs, rng) {
  let r = rng();
  for (let i = 0; i < probs.length; i++) {
    r -= probs[i];
    if (r <= 0) return i;
  }
  return probs.length - 1;
}

const argmax = (arr) => arr.reduce((best, v, i) => (v > arr[best] ? i : best), 0);

// The AI's pick for the coming round, plus what it expects from the player (for the UI).
export function chooseMove(model, rng = Math.random) {
  const confidence = confidenceOf(model);
  const gamma = 1 + confidence * 3; // more data -> follows its prediction more strictly

  const playerAttack = predict(model.attack, model.attackAfter, model.lastAttack);
  const playerDefense = predict(model.defense, model.defenseAfter, model.lastDefense);

  // guard where the player is most likely to strike
  const defense = sample(withExploration(sharpen(playerAttack, gamma)), rng);

  // strike where the player is least likely to be guarding
  const openness = normalize(playerDefense.map((p) => 1 - p));
  const attack = sample(withExploration(sharpen(openness, gamma)), rng);

  const guess = argmax(playerAttack);

  return {
    attack: BODY_PARTS[attack],
    defense: BODY_PARTS[defense],
    expected: { attack: BODY_PARTS[guess], chance: playerAttack[guess], confidence },
  };
}

// Habits worth showing the player: their favourite zones and how sure the AI is.
export function describeHabits(model) {
  if (model.rounds < 3) return null;
  const favourite = (counts) => {
    const probs = smoothed(counts);
    const i = argmax(probs);
    return { zone: BODY_PARTS[i], share: probs[i] };
  };
  return {
    attack: favourite(model.attack),
    defense: favourite(model.defense),
    confidence: confidenceOf(model),
  };
}
