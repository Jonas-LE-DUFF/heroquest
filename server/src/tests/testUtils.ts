import { Equipment } from "../POO/classes/Equipment/Equipment";
import { Position } from "../POO/classes/Position/Position";
import { Game } from "../POO/classes/Server/Game";
import { Player } from "../POO/classes/Server/Player";
import { Hero } from "../POO/classes/Units/Hero";
import { Monster } from "../POO/classes/Units/Monster";
import { Stats } from "../POO/classes/Units/Stats";
import { TileType } from "../POO/enums/Board/TileType";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { MonsterCategory } from "../POO/enums/Categories/MonsterCategory";
import { MonsterType } from "../POO/enums/MonsterType";
import { PlayerRole } from "../POO/enums/PlayerRole";

function createTestStats(overrides?: Partial<Stats>): Stats {
  return {
    health: 5,
    maxHealth: 10,
    movements: 2,
    nbDefenseDice: 2,
    spirit: 3,
    ...overrides,
  };
}

function createTestEquipment(weaponId: string = "short_sword"): Equipment {
  const equipment = new Equipment(0);
  equipment.addEquipmentById(weaponId);
  return equipment;
}

function createTestHero(
  overrides?: Partial<{
    controlledById: string;
    name: string;
    category: HeroCategory;
    stats: Stats;
    weaponId: string;
  }>,
): Hero {
  const {
    controlledById = "player-1",
    name = "TestHero",
    category = HeroCategory.Barbarian,
    stats = createTestStats(),
    weaponId = "short_sword",
  } = overrides ?? {};
  const equipment = createTestEquipment(weaponId);
  return new Hero(controlledById, name, category, stats, equipment);
}

function createTestMonster(
  overrides?: Partial<{
    controlledById: string;
    name: string;
    category: MonsterCategory;
    stats: Stats;
    nbAttackDice: number;
  }>,
): Monster {
  const {
    controlledById = "gm-1",
    name = "Goblin",
    category = MonsterCategory.Goblin,
    stats = createTestStats(),
    nbAttackDice = 2,
  } = overrides ?? {};
  return new Monster(
    controlledById,
    name,
    category,
    stats,
    nbAttackDice,
    MonsterType.ORC_LIKE,
  );
}

function setupGameWithPlayers(): Game {
  const game = new Game("test-game");
  game.gameState.board.getTileAtPosition(new Position(0, 0))!.type =
    TileType.SPAWN_POINT;
  const gm = new Player("GameMaster", PlayerRole.GAME_MASTER);
  const p1 = new Player("Player1", PlayerRole.HERO);
  const p2 = new Player("Player2", PlayerRole.HERO);
  game.addPlayer(gm);
  game.addPlayer(p1);
  game.addPlayer(p2);

  const equipment1 = new Equipment(0);
  equipment1.addEquipmentById("barbarian_sword");
  const hero1 = new Hero(
    p1.id,
    "Barbarian",
    HeroCategory.Barbarian,
    { health: 8, maxHealth: 8, spirit: 2, nbDefenseDice: 2, movements: 2 },
    equipment1,
  );

  const equipment2 = new Equipment(0);
  equipment2.addEquipmentById("short_sword");
  const hero2 = new Hero(
    p2.id,
    "Dwarf",
    HeroCategory.Dwarf,
    { health: 7, maxHealth: 7, spirit: 3, nbDefenseDice: 2, movements: 2 },
    equipment2,
  );

  game.gameState.addUnit(hero1);
  game.gameState.addUnit(hero2);
  game.launchGame();

  return game;
}

export {
  createTestStats,
  createTestEquipment,
  createTestHero,
  createTestMonster,
  setupGameWithPlayers,
};
