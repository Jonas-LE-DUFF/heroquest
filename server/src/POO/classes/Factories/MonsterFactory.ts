import { GameService } from "../../../services/GameService";
import { MonsterCategory } from "../../enums/Categories/MonsterCategory";
import { Game } from "../Server/Game";
import { Monster } from "../Units/Monster";
import monsterStats from "../../../shared/game_cards/monsters.json";
import { Stats } from "../Units/Stats";
import { MonsterType } from "../../enums/MonsterType";
import { logger } from "../../../utils/logger";

class MonsterFactory {
  gameId: string;

  constructor(gameId: string) {
    this.gameId = gameId;
  }

  createMonster(monsterType: MonsterCategory): Monster {
    const game: Game = GameService.getGame(this.gameId)!;
    const gameMasterId = game.getGameMaster().id;

    const monster = generateMonster(gameMasterId, monsterType);
    return monster;
  }
}

export { MonsterFactory };

function generateMonster(controllerId: string, monsterType: MonsterCategory) {
  const stats: { stats: Stats; attack: number; monsterType: MonsterType } =
    getMonsterStats(monsterType);

  const monster: Monster = new Monster(
    controllerId,
    MonsterCategory[monsterType],
    monsterType,
    stats.stats,
    stats.attack,
    stats.monsterType,
  );

  return monster;
}

function getMonsterStats(monsterType: MonsterCategory): {
  stats: Stats;
  attack: number;
  monsterType: MonsterType;
} {
  const monster = monsterStats.find((monster) => {
    return monster.id === (monsterType as number);
  });
  if (!monster) {
    logger.error(
      `Monster stats not found for type: ${MonsterCategory[monsterType]}`,
    );
    throw new Error("Monster stats not found");
  }
  const stats: Stats = {
    movements: monster.movements,
    nbDefenseDice: monster.nbDefenseDice,
    health: monster.health,
    maxHealth: monster.health,
    spirit: monster.spiritPoints,
  };
  return {
    stats,
    attack: monster.nbAttackDice,
    monsterType: MonsterType[monster.monsterType as keyof typeof MonsterType],
  };
}
