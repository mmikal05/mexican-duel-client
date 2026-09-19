export const BODY_PARTS = ["head", "body", "waist", "legs", "foot"];

export const MAX_HP = 100;

// Used by the local vs-AI mode. Online rounds are timed by the server
// (ROUND_MS / BETWEEN_ROUNDS_MS in server/index.js), keep the values similar.
export const ROUND_TIME = 10; // seconds
export const BETWEEN_ROUNDS_MS = 2000;

// EXP awarded for finishing an online duel
export const XP_REWARD = { win: 100, tie: 50, lose: 25 };
