// Level 1 starts at 0 EXP and every level asks for more than the one before:
// level 2 = 200, level 3 = 600, level 4 = 1200, level 5 = 2000 ...
// (a PvP win is worth roughly 200-300 EXP, a practice win 20)
export const expForLevel = (level) => 100 * level * (level - 1);

export function getLevelInfo(exp) {
  const total = Math.max(0, Math.floor(exp || 0));

  let level = 1;
  while (total >= expForLevel(level + 1)) level++;

  const start = expForLevel(level);
  const next = expForLevel(level + 1);

  return {
    level,
    current: total - start, // EXP earned inside this level
    needed: next - start, // EXP this level takes
    toNext: next - total,
    progress: (total - start) / (next - start),
  };
}
