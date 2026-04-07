// Mock ServerHeroQuest singleton FIRST (before any imports that use it)
jest.mock("../server/ServerHeroQuest", () => {
  const mockIo = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };
  return {
    ServerHeroQuest: {
      getServerInstance: jest.fn().mockReturnValue({
        getIo: jest.fn().mockReturnValue(mockIo),
        createGame: jest.fn(),
        getGame: jest.fn(),
        getGameByName: jest.fn(),
        removeGame: jest.fn(),
      }),
    },
  };
});

import { Position } from "../POO/classes/Position/Position";
import { Direction } from "../POO/enums/Direction";
import { Hero } from "../POO/classes/Units/Hero";
import { Monster } from "../POO/classes/Units/Monster";
import { Equipment } from "../POO/classes/Equipment/Equipment";
import { Board } from "../POO/classes/Board/Board";
import { GameState } from "../POO/classes/GameState";
import { Game } from "../POO/classes/Server/Game";
import { Player } from "../POO/classes/Server/Player";
import { Spell } from "../POO/classes/Spell/Spell";
import { HealSpellEffect } from "../POO/classes/Spell/HealSpellEffect";
import { ApplyEffectSpellEffect } from "../POO/classes/Spell/ApplyEffectSpellEffect";
import { Effect, EffectFactory } from "../POO/classes/Effects/Effects";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { MonsterCategory } from "../POO/enums/Categories/MonsterCategory";
import { PlayerRole } from "../POO/enums/PlayerRole";
import { FightDiceFaces } from "../POO/enums/Dices/FightDiceFaces";
import { SpellElement } from "../POO/enums/SpellElement";
import { Stats } from "../POO/classes/Units/Stats";
import { dealDamage } from "../services/CombatService";
import { moveUnit, handleDoorOpening } from "../services/MovementService";
import { MonsterType } from "../POO/enums/MonsterType";
import { TileType } from "../POO/enums/Board/TileType";
import { TrapType } from "../POO/enums/Board/TrapType";
import { ServerHeroQuest } from "../server/ServerHeroQuest";

// ── Helper functions ──

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
  game.gameState.board.placeUnitAt(hero1, new Position(0, 0));
  game.gameState.board.placeUnitAt(hero2, new Position(1, 0));

  return game;
}

// ── Tests ──

beforeEach(() => {
  jest.clearAllMocks();
});

describe("dealDamage (CombatService)", () => {
  it("should reduce health by the damage amount", () => {
    const monster = createTestMonster({
      stats: createTestStats({ health: 5 }),
    });
    dealDamage("test-game", monster, 3);
    expect(monster.stats.health).toBe(2);
  });

  it("should not change health when damage is 0", () => {
    const monster = createTestMonster({
      stats: createTestStats({ health: 5 }),
    });
    dealDamage("test-game", monster, 0);
    expect(monster.stats.health).toBe(5);
  });

  it("should not change health when damage is negative", () => {
    const monster = createTestMonster({
      stats: createTestStats({ health: 5 }),
    });
    dealDamage("test-game", monster, -2);
    expect(monster.stats.health).toBe(5);
  });
});

describe("dealDamage - lethal damage (CombatService)", () => {
  it("should set health to 0 when damage exceeds health", () => {
    const monster = createTestMonster({
      stats: createTestStats({ health: 3 }),
    });
    dealDamage("test-game", monster, 5);
    expect(monster.stats.health).toBe(0);
  });

  it("should set health to 0 when damage equals health", () => {
    const monster = createTestMonster({
      stats: createTestStats({ health: 3 }),
    });
    dealDamage("test-game", monster, 3);
    expect(monster.stats.health).toBe(0);
  });
});

describe("moveUnit (MovementService)", () => {
  it("should move a hero to a new tile", async () => {
    const board = new Board();
    const hero = createTestHero();
    // Place hero at a safe interior position
    board.placeUnitAt(hero, new Position(5, 5));

    const result = await moveUnit(board, new Position(5, 5), Direction.DOWN, hero);

    expect(result.success).toBe(true);
    expect(board.getUnitAt(new Position(5, 5))).toBeUndefined();
    expect(board.getUnitAt(new Position(6, 5))).toBe(hero.id);
  });

  it("should fail when moving out of bounds", async () => {
    const board = new Board();
    const hero = createTestHero();
    board.placeUnitAt(hero, new Position(0, 0));

    const result = await moveUnit(board, new Position(0, 0), Direction.UP, hero);
    expect(result.success).toBe(false);
  });

  it("should fail when moving to an occupied tile", async () => {
    const board = new Board();
    const hero = createTestHero();
    const monster = createTestMonster();

    // Place in interior positions away from walls
    board.placeUnitAt(hero, new Position(5, 5));
    board.placeUnitAt(monster, new Position(6, 5));

    const result = await moveUnit(board, new Position(5, 5), Direction.DOWN, hero);
    expect(result.success).toBe(false);
    expect(result.error).toBe("tile is occupied");
  });

  it("should fail when moving into a wall", async () => {
    const board = new Board();
    const hero = createTestHero();
    board.placeUnitAt(hero, new Position(5, 5));

    board.getTileAtPosition(new Position(5, 5).afterMove(Direction.DOWN))!.type = TileType.WALL;

    const result = await moveUnit(board, new Position(5, 5), Direction.DOWN, hero);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Tile is impassable");
  });
});

describe("handleDoorOpening (MovementService)", () => {
  it("should open a door that exists at the given position and direction", () => {
    const board = new Board();
    const pos = new Position(5, 5);
    const dir = Direction.RIGHT;

    board.placeDoor(pos, dir);
    expect(board.hasDoorAt(pos, dir)).toBe(true);

    handleDoorOpening(board, pos, dir);
    expect(board.hasDoorAt(pos, dir)).toBe(false);
  });

  it("should do nothing when no door exists", () => {
    const board = new Board();
    const pos = new Position(5, 5);
    const dir = Direction.RIGHT;

    // No door placed — should not throw
    handleDoorOpening(board, pos, dir);
    expect(board.hasDoorAt(pos, dir)).toBeFalsy();
  });
});

describe("placeMonster (GameState.addUnit)", () => {
  it("should include the monster in the Units array", () => {
    const gameState = new GameState();
    const monster = createTestMonster();

    gameState.addUnit(monster);
    expect(gameState.Units).toContain(monster);
  });
});

describe("placeDoor (Board)", () => {
  it("should place a door and detect it", () => {
    const board = new Board();
    const result = board.placeDoor(new Position(5, 5), Direction.RIGHT);

    expect(result.success).toBe(true);
    expect(board.hasDoorAt(new Position(5, 5), Direction.RIGHT)).toBe(true);
  });

  it("should also set a wall where the door is placed", () => {
    const board = new Board();
    board.placeDoor(new Position(5, 5), Direction.RIGHT);
    expect(board.hasWallAt(new Position(5, 5), Direction.RIGHT)).toBe(true);
  });
});

describe("updateUnitStats (GameState)", () => {
  it("should update stats of a unit at a given position", () => {
    const gameState = new GameState();
    const hero = createTestHero();
    gameState.addUnit(hero);
    gameState.board.placeUnitAt(hero, new Position(2, 2));

    gameState.updateUnitStats(
      {
        movements: 5,
        health: 10,
        maxHealth: 15,
        spirit: 3,
        defense: 2,
        attack: 0,
        effects: [],
      },
      new Position(2, 2),
    );

    expect(hero.stats.movements).toBe(5);
    expect(hero.stats.health).toBe(10);
    expect(hero.stats.maxHealth).toBe(15);
    expect(hero.stats.spirit).toBe(3);
    expect(hero.stats.nbDefenseDice).toBe(2);
  });

  it("should throw when no unit exists at the position", () => {
    const gameState = new GameState();

    expect(() =>
      gameState.updateUnitStats(
        {
          movements: 5,
          health: 10,
          maxHealth: 15,
          spirit: 3,
          defense: 2,
          attack: 0,
          effects: [],
        },
        new Position(9, 9),
      ),
    ).toThrow();
  });
});

describe("castSpell (Hero)", () => {
  it("should heal a hero with HealSpellEffect", () => {
    const hero = createTestHero({
      stats: createTestStats({ health: 3, maxHealth: 10 }),
    });
    const healEffect = new HealSpellEffect(4);
    const spell = new Spell("heal-1", "Heal", SpellElement.Earth, healEffect, [
      "self",
    ]);
    hero.setSpells([spell]);

    hero.castSpell(spell, hero);

    expect(hero.stats.health).toBe(7);
    expect(hero.usedSpells).toContain(spell);
  });

  it("should not heal above maxHealth", () => {
    const hero = createTestHero({
      stats: createTestStats({ health: 8, maxHealth: 10 }),
    });
    const healEffect = new HealSpellEffect(5);
    const spell = new Spell(
      "heal-2",
      "BigHeal",
      SpellElement.Earth,
      healEffect,
      ["self"],
    );
    hero.setSpells([spell]);

    hero.castSpell(spell, hero);

    expect(hero.stats.health).toBe(10);
  });

  it("should apply an effect with ApplyEffectSpellEffect", () => {
    const hero = createTestHero();
    const rockSkin = EffectFactory.createRockSkin();
    const applyEffect = new ApplyEffectSpellEffect(rockSkin);
    const spell = new Spell(
      "rockskin-1",
      "Rock Skin",
      SpellElement.Earth,
      applyEffect,
      ["self"],
    );
    hero.setSpells([spell]);

    hero.castSpell(spell, hero);

    expect(hero.effects).toContain(rockSkin);
    expect(hero.usedSpells).toContain(spell);
  });
});

describe("endTurn (Game)", () => {
  it("should start on monster turn after launching", () => {
    const game = setupGameWithPlayers();
    game.launchGame();

    expect(game.isMonsterTurn).toBe(true);
  });

  it("should transition from monster turn to first hero turn", () => {
    const game = setupGameWithPlayers();
    game.launchGame();

    game.endTurn(); // end monster turn
    expect(game.isMonsterTurn).toBe(false);
    expect(game.currentTurnIndex).toBe(0);
  });

  it("should cycle through hero turns then back to monster turn", () => {
    const game = setupGameWithPlayers();
    game.launchGame();

    // End monster turn -> hero 1
    game.endTurn();
    expect(game.isMonsterTurn).toBe(false);
    expect(game.currentTurnIndex).toBe(0);

    // End hero 1 turn -> hero 2
    game.endTurn();
    expect(game.isMonsterTurn).toBe(false);
    expect(game.currentTurnIndex).toBe(1);

    // End hero 2 turn (last hero) -> monster turn
    // After the last hero ends, isMonsterTurn becomes true
    game.endTurn();
    expect(game.isMonsterTurn).toBe(true);
  });

  it("should cycle back to first hero after a full round", () => {
    const game = setupGameWithPlayers();
    game.launchGame();

    // Full cycle: monster -> hero1 -> hero2 -> monster -> hero1
    game.endTurn(); // monster -> hero1
    game.endTurn(); // hero1 -> hero2
    game.endTurn(); // hero2 -> monster
    game.endTurn(); // monster -> hero1 again

    expect(game.isMonsterTurn).toBe(false);
    expect(game.currentTurnIndex).toBe(0);
  });
});

describe("FightDiceFaces enum values", () => {
  it("should have correct numeric values", () => {
    expect(FightDiceFaces.WhiteShield).toBe(1);
    expect(FightDiceFaces.BlackShield).toBe(2);
    expect(FightDiceFaces.Hit).toBe(3);
  });
});

describe("SpecialAuthorizedHero (GameState)", () => {
  it("should set and retrieve a special authorized hero", () => {
    const gameState = new GameState();
    const specialHero = {
      heroId: "hero-123",
      numberOfDices: 3,
      diceType: "fight" as const,
    };

    gameState.setSpecialAuthorizedHero(specialHero);
    expect(gameState.getSpecialAuthorizedHero()).toEqual(specialHero);
  });

  it("should return undefined when cleared", () => {
    const gameState = new GameState();
    const specialHero = {
      heroId: "hero-123",
      numberOfDices: 3,
      diceType: "red" as const,
    };

    gameState.setSpecialAuthorizedHero(specialHero);
    gameState.setSpecialAuthorizedHero(undefined);

    expect(gameState.getSpecialAuthorizedHero()).toBeUndefined();
  });

  it("should return undefined by default", () => {
    const gameState = new GameState();
    expect(gameState.getSpecialAuthorizedHero()).toBeUndefined();
  });
});

describe("removeUnit (GameState)", () => {
  it("should remove a monster from Units array and board", () => {
    const gameState = new GameState();
    const monster = createTestMonster();
    const pos = new Position(4, 4);

    gameState.addUnit(monster);
    gameState.board.placeUnitAt(monster, pos);
    expect(gameState.Units).toContain(monster);

    gameState.removeUnit(monster);
    expect(gameState.Units).not.toContain(monster);
    expect(gameState.getUnitByPosition(new Position(4, 4))).toBeUndefined();
  });

  it("should not throw when removing a unit that doesn't exist", () => {
    const gameState = new GameState();
    const monster = createTestMonster();

    expect(() => gameState.removeUnit(monster)).not.toThrow();
  });
});

describe("clearTileAtPosition (GameState)", () => {
  it("should clear a tile and remove the monster from Units", () => {
    const gameState = new GameState();
    const monster = createTestMonster();
    const pos = new Position(4, 4);

    gameState.addUnit(monster);
    gameState.board.placeUnitAt(monster, pos);
    gameState.clearTileAtPosition(new Position(4, 4));

    expect(gameState.getUnitByPosition(new Position(4, 4))).toBeUndefined();
    expect(gameState.Units).not.toContain(monster);
  });

  it("should not throw when clearing an empty tile", () => {
    const gameState = new GameState();
    expect(() =>
      gameState.clearTileAtPosition(new Position(4, 4)),
    ).not.toThrow();
  });

  describe("traps", () => {
    it("should trigger the trap effect when a hero steps on a trap tile", async () => {
      const gameState = new GameState();
      const hero = createTestHero({
        stats: createTestStats({ health: 5 }),
      });
      const pos = new Position(4, 4);

      gameState.addUnit(hero);
      gameState.board.placeUnitAt(hero, pos);
      gameState.board.placeTrap("test-game", pos.afterMove(Direction.DOWN), TrapType.PIT_TRAP);

      await moveUnit(gameState.board, pos, Direction.DOWN, hero);

      // The pit trap should deal 1 damage to the hero
      expect(hero.stats.health).toBe(4);
      expect(
        gameState.board.getTileAtPosition(pos.afterMove(Direction.DOWN))?.trap
          ?.hasBeenTriggered,
      ).toBe(true);
    });

    it("should not trigger the trap effect when a monster steps on a trap tile", async () => {
      const gameState = new GameState();
      const monster = createTestMonster({
        stats: createTestStats({ health: 5 }),
      });
      const pos = new Position(4, 4);

      gameState.addUnit(monster);
      gameState.board.placeUnitAt(monster, pos);
      gameState.board.placeTrap("test-game", pos.afterMove(Direction.DOWN), TrapType.PIT_TRAP);

      await moveUnit(gameState.board, pos, Direction.DOWN, monster);

      // The pit trap should not affect the monster
      expect(monster.stats.health).toBe(5);
      expect(gameState.board.getTileAtPosition(pos.afterMove(Direction.DOWN))?.trap?.hasBeenTriggered).toBe(false);
    });

    it("should only trigger the spear trap once", async () => {
      const gameState = new GameState();
      const hero = createTestHero({
        stats: createTestStats({ health: 5 }),
      });
      const pos = new Position(4, 4);

      gameState.addUnit(hero);
      gameState.board.placeUnitAt(hero, pos);
      gameState.board.placeTrap("test-game", pos.afterMove(Direction.DOWN), TrapType.SPEAR_TRAP);

      // Step on the trap tile for the first time
      await moveUnit(gameState.board, pos, Direction.DOWN, hero);
      const healthAfterFirstTrigger = hero.stats.health;

      // Move back and step on the trap tile again
      await moveUnit(gameState.board, pos.afterMove(Direction.DOWN), Direction.UP, hero);
      await moveUnit(gameState.board, pos, Direction.DOWN, hero);

      // The trap should not trigger again, so health should remain the same
      expect(hero.stats.health).toBe(healthAfterFirstTrigger);
    });

    it("pit trap should reduce attack dice by one", async () => {
      const gameState = new GameState();
      const hero = createTestHero({
        stats: createTestStats({ health: 5 }),
      });
      const pos = new Position(4, 4);

      gameState.addUnit(hero);
      gameState.board.placeUnitAt(hero, pos);
      gameState.board.placeTrap("test-game", pos.afterMove(Direction.DOWN), TrapType.PIT_TRAP);

      await moveUnit(gameState.board, pos, Direction.DOWN, hero);

      // The pit trap should deal 1 damage but not reduce attack dice
      expect(hero.stats.health).toBe(4);
      expect(hero.getAttackDiceCount()).toBe(1); // short sword base attack dice is 2
    });
    
    it("pit trap should not reduce attack dice below 1", async () => {
      const gameState = new GameState();
      const hero = createTestHero({
        stats: createTestStats({ health: 5 }),
        weaponId: "dagger", // dagger has 1 attack dice
      });
      const pos = new Position(4, 4);

      gameState.addUnit(hero);
      gameState.board.placeUnitAt(hero, pos);
      gameState.board.placeTrap("test-game", pos.afterMove(Direction.DOWN), TrapType.PIT_TRAP);

      await moveUnit(gameState.board, pos, Direction.DOWN, hero);

      // The pit trap should deal 1 damage but not reduce attack dice below 1
      expect(hero.stats.health).toBe(4);
      expect(hero.getAttackDiceCount()).toBe(1); // should not go below 1
    });

    it("rock trap should place a wall on the trap tile after triggering", async () => {
      const gameState = new GameState();
      const hero = createTestHero({
        stats: createTestStats({ health: 5 }),
      });
      const pos = new Position(4, 4);

      const server = ServerHeroQuest.getServerInstance() as unknown as {
        getGame: jest.Mock;
      };
      server.getGame.mockReturnValue({ gameState });

      gameState.addUnit(hero);
      gameState.board.placeUnitAt(hero, pos);
      gameState.board.placeTrap("test-game", pos.afterMove(Direction.DOWN), TrapType.ROCK_TRAP);

      await moveUnit(gameState.board, pos, Direction.DOWN, hero);

      // The rock trap should place a wall on the tile after the trap in the direction the hero came from
      expect(gameState.board.getTileAtPosition(pos.afterMove(Direction.DOWN))?.type).toBe(TileType.WALL);
    });
  });
});
