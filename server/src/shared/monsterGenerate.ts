import { Monster, monsterClass, Unit } from "./type";
import monsterStats from "./stats/monsters.json"

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
  const monster = monsterStats.find((monster) => {
    return monster.id === monsterType;
  });
  if (!monster) {
    console.error(`Monster stats not found for type: ${monsterClass[monsterType]}`);
    return {
      name: monsterClass[monsterType],
      hp: 1,
      maxHp: 1,
      spiritPoints: 1,
      nbAttackDice: 1,
      nbDefenseDice: 1,
      movements: 1,
    };
  }
  return {
    name: monsterClass[monsterType],
    hp: monster.health,
    maxHp: monster.health,
    spiritPoints: monster.spiritPoints,
    nbAttackDice: monster.nbAttackDice,
    nbDefenseDice: monster.nbDefenseDice,
    movements: monster.movements,
  };
}

export { generateMonster };
