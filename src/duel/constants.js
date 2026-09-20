export const BODY_PARTS = ["head", "body", "waist", "legs", "foot"];

export const MAX_HP = 100;

// Used by the local vs-AI mode. Online rounds are timed by the server
// (ROUND_MS / BETWEEN_ROUNDS_MS in server/index.js), keep the values similar.
export const ROUND_TIME = 10; // seconds
export const BETWEEN_ROUNDS_MS = 2000;

// Wagers (coins each). The server enforces MAX_WAGER as well.
export const WAGER_PRESETS = [0, 10, 25, 50, 100];
export const MAX_WAGER = 1000;

// Quick reactions (must match EMOTES in server/index.js)
export const EMOTES = ["👋", "🔥", "😎", "😂", "👏", "💀", "GG", "🤝"];

// Practice matches only pay a little EXP. Online EXP is worked out by the server
// (winner: damage dealt * 1.1 + HP left * 1.2 + 100, loser: 50).
export const XP_AI = { win: 20, tie: 10, lose: 5 };

// Share of the pot the game keeps on wagered duels (must match the server).
export const WAGER_FEE_RATE = 0.1;
