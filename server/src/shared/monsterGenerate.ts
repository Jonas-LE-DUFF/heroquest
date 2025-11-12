import { Monster, monsterClass, Unit } from "./type";

function generateMonster(monsterId: string, monsterType: monsterClass) {
  const stats: Unit = getMonsterStats(monsterType);
  const monster: Monster = {
    id: monsterId,
    stats: stats,
    class: monsterType,
  };

  return monster;
}

function getMonsterStats(monsterType: monsterClass): Unit {
  return {
    name: monsterClass[monsterType],
    hp: 1,
    maxHp: 1,
    spiritPoints: 1,
    nbAttackDice: 1,
    nbDefenseDice: 1,
    movements: 10,
  };
}

export { generateMonster };
