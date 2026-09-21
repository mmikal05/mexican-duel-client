import { GEAR_ITEMS } from "./equipment";

export const BASE_STATS = {
  maxHp: 100,
  attack: 10,
  critChance: 0.20,
  blockReduction: 0,
  blockDamage: 5,
  expBonus: 0,
  coinBonus: 0,
};

export function calculatePlayerStats(equipped = {}) {
  let hpBonus = 0;
  let attackBonus = 0;
  let critBonus = 0;
  let blockBonus = 0;
  let expBonus = 0;
  let coinBonus = 0;

  if (equipped && typeof equipped === "object") {
    for (const slot of ["head", "chest", "weapon", "accessory"]) {
      const gearId = equipped[slot];
      if (!gearId) continue;
      const item = GEAR_ITEMS[gearId];
      if (!item?.stats) continue;

      if (item.stats.hp) hpBonus += item.stats.hp;
      if (item.stats.attack) attackBonus += item.stats.attack;
      if (item.stats.crit) critBonus += item.stats.crit;
      if (item.stats.block) blockBonus += item.stats.block;
      if (item.stats.exp) expBonus += item.stats.exp;
      if (item.stats.coinBonus) coinBonus += item.stats.coinBonus;
    }
  }

  return {
    maxHp: BASE_STATS.maxHp + hpBonus,
    hpBonus,
    attack: BASE_STATS.attack + attackBonus,
    attackBonus,
    critChance: Math.min(0.75, BASE_STATS.critChance + critBonus),
    critBonus,
    blockReduction: blockBonus,
    blockDamage: Math.max(1, BASE_STATS.blockDamage - blockBonus),
    expBonus,
    coinBonus,
  };
}
