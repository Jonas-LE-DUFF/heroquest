import { GameState } from "../POO/classes/GameState";
import { Position } from "../POO/classes/Position/Position";
import { Game } from "../POO/classes/Server/Game";
import { TileType } from "../POO/enums/Board/TileType";
import { TrapType } from "../POO/enums/Board/TrapType";
import { FightDiceFaces } from "../POO/enums/Dices/FightDiceFaces";
import { Direction } from "../POO/enums/Direction";
import { ServerHeroQuest } from "../server/ServerHeroQuest";
import { DiceServiceRegistry } from "../services/DiceServiceRegistry";
import { moveUnit } from "../services/MovementService";
import {
  createTestHero,
  createTestMonster,
  createTestStats,
} from "./testUtils";

// Mock ServerHeroQuest singleton FIRST (before any imports that use it)
jest.mock("../server/ServerHeroQuest", () => {
  const mockIo = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    sockets: {
      adapter: {
        rooms: new Map(),
      },
      get: jest.fn(),
    },
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

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  DiceServiceRegistry.reset(); // propre entre chaque test
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
    gameState.board.placeTrap(
      "test-game",
      pos.afterMove(Direction.DOWN),
      TrapType.PIT_TRAP,
    );

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
    gameState.board.placeTrap(
      "test-game",
      pos.afterMove(Direction.DOWN),
      TrapType.PIT_TRAP,
    );

    await moveUnit(gameState.board, pos, Direction.DOWN, monster);

    // The pit trap should not affect the monster
    expect(monster.stats.health).toBe(5);
    expect(
      gameState.board.getTileAtPosition(pos.afterMove(Direction.DOWN))?.trap
        ?.hasBeenTriggered,
    ).toBe(false);
  });

  describe("pit trap", () => {
    it("pit trap should reduce attack and defense dice by one", async () => {
      const gameState = new GameState();
      const hero = createTestHero({
        stats: createTestStats({ health: 5 }),
      });
      const pos = new Position(4, 4);

      gameState.addUnit(hero);
      gameState.board.placeUnitAt(hero, pos);
      gameState.board.placeTrap(
        "test-game",
        pos.afterMove(Direction.DOWN),
        TrapType.PIT_TRAP,
      );

      await moveUnit(gameState.board, pos, Direction.DOWN, hero);

      // The pit trap should deal 1 damage but not reduce attack dice
      expect(hero.stats.health).toBe(4);
      expect(hero.getAttackDiceCount()).toBe(1); // short sword base attack dice is 2
      expect(hero.getDefenseDiceCount()).toBe(1); // base defense dice is 2
    });

    it("pit trap should not reduce attack or defense dice below 1", async () => {
      const gameState = new GameState();
      const hero = createTestHero({
        stats: createTestStats({ health: 5, nbDefenseDice: 1 }),
        weaponId: "dagger", // dagger has 1 attack dice
      });
      const pos = new Position(4, 4);

      gameState.addUnit(hero);
      gameState.board.placeUnitAt(hero, pos);
      gameState.board.placeTrap(
        "test-game",
        pos.afterMove(Direction.DOWN),
        TrapType.PIT_TRAP,
      );

      await moveUnit(gameState.board, pos, Direction.DOWN, hero);

      // The pit trap should deal 1 damage but not reduce attack dice below 1
      expect(hero.stats.health).toBe(4);
      expect(hero.getAttackDiceCount()).toBe(1); // should not go below 1
      expect(hero.getDefenseDiceCount()).toBe(1); // should not go below 1
    });

    it("leaving pit trap should remove the pit trap effect", async () => {
      const gameState = new GameState();
      const hero = createTestHero({
        stats: createTestStats({ health: 5 }),
      });
      const pos = new Position(4, 4);

      gameState.addUnit(hero);
      gameState.board.placeUnitAt(hero, pos);
      gameState.board.placeTrap(
        "test-game",
        pos.afterMove(Direction.DOWN),
        TrapType.PIT_TRAP,
      );
      await moveUnit(gameState.board, pos, Direction.DOWN, hero);

      // test may failed after making traps end the player's turn

      // Move back up to leave the trap tile
      await moveUnit(
        gameState.board,
        pos.afterMove(Direction.DOWN),
        Direction.UP,
        hero,
      );

      expect(hero.stats.health).toBe(4); // health should remain the same
      expect(hero.getAttackDiceCount()).toBe(2); // attack dice should be restored after leaving the trap
      expect(hero.getDefenseDiceCount()).toBe(2); // defense dice should be restored after leaving the trap
    });
  });
});

describe("jump above traps", () => {
  it("should allow jumping over a trap tile and not trigger the trap", async () => {
    const gameState = new GameState();
    const hero = createTestHero({
      stats: createTestStats({ health: 5 }),
    });
    const pos = new Position(4, 4);

    gameState.addUnit(hero);
    gameState.board.placeUnitAt(hero, pos);
    gameState.board.placeTrap(
      "test-game",
      pos.afterMove(Direction.DOWN),
      TrapType.SPEAR_TRAP,
    );
    gameState.board.getTileAtPosition(
      pos.afterMove(Direction.DOWN),
    )!.trap!.isRevealed = true;

    DiceServiceRegistry.override({
      rollFightDice: jest.fn().mockResolvedValue({
        success: true,
        results: [FightDiceFaces.WhiteShield],
      }),
      rollRedDice: jest.fn().mockResolvedValue({ success: true, results: [1] }),
    }); // Force the jump to succeed

    // Attempt to jump over the trap tile
    const result = await moveUnit(gameState.board, pos, Direction.DOWN, hero);

    expect(result.success).toBe(true);
    expect(
      gameState.board.getTileAtPosition(pos.afterMove(Direction.DOWN))?.trap
        ?.isRevealed,
    ).toBe(true); // trap should still be revealed
    expect(
      gameState.board.getTileAtPosition(pos.afterMove(Direction.DOWN))?.trap
        ?.hasBeenTriggered,
    ).toBe(false); // trap should not be triggered
    expect(hero.stats.health).toBe(5); // health should remain the same
  });
});

describe("rock trap", () => {
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
    gameState.board.placeTrap(
      "test-game",
      pos.afterMove(Direction.DOWN),
      TrapType.ROCK_TRAP,
    );

    DiceServiceRegistry.override({
      rollFightDice: jest.fn().mockResolvedValueOnce({
        success: true,
        results: [
          FightDiceFaces.Hit,
          FightDiceFaces.BlackShield,
          FightDiceFaces.Hit,
        ],
      }),
      rollRedDice: jest
        .fn()
        .mockResolvedValueOnce({ success: true, results: [1] }),
    }); // Force the rock trap to deal 2 damage

    await moveUnit(gameState.board, pos, Direction.DOWN, hero);

    // The rock trap should place a wall on the tile after the trap in the direction the hero came from
    expect(
      gameState.board.getTileAtPosition(pos.afterMove(Direction.DOWN))?.type,
    ).toBe(TileType.WALL);
    expect(hero.stats.health).toBe(3); // health should be reduced by 2 from the rock trap
  });

  it("rock trap killing player should not throw an error", async () => {
    const game = new Game("test-game");
    const gameState = new GameState();
    game.gameState = gameState;
    const hero = createTestHero({
      stats: createTestStats({ health: 3 }),
    });
    const pos = new Position(4, 4);

    const server = ServerHeroQuest.getServerInstance() as unknown as {
      getGame: jest.Mock;
    };
    server.getGame.mockReturnValue(game);

    gameState.addUnit(hero);
    gameState.board.placeUnitAt(hero, pos);
    gameState.board.placeTrap(
      "test-game",
      pos.afterMove(Direction.DOWN),
      TrapType.ROCK_TRAP,
    );

    DiceServiceRegistry.override({
      rollFightDice: jest.fn().mockResolvedValueOnce({
        success: true,
        results: [FightDiceFaces.Hit, FightDiceFaces.Hit, FightDiceFaces.Hit],
      }),
      rollRedDice: jest
        .fn()
        .mockResolvedValueOnce({ success: true, results: [1] }),
    }); // Force the rock trap to deal 2 damage

    await moveUnit(gameState.board, pos, Direction.DOWN, hero);

    // The rock trap should place a wall on the tile after the trap in the direction the hero came from
    expect(
      gameState.board.getTileAtPosition(pos.afterMove(Direction.DOWN))?.type,
    ).toBe(TileType.WALL);
    expect(
      gameState.board.getTileAtPosition(pos.afterMove(Direction.DOWN))?.trap,
    ).toBeNull(); // trap should be removed after triggering
  });
});

describe("spear trap", () => {
  it("spear trap should disapear after triggering", async () => {
    const gameState = new GameState();
    const hero = createTestHero({
      stats: createTestStats({ health: 5 }),
    });

    const server = ServerHeroQuest.getServerInstance() as unknown as {
      getGame: jest.Mock;
    };
    server.getGame.mockReturnValue({ gameState });
    const pos = new Position(4, 4);

    gameState.addUnit(hero);
    gameState.board.placeUnitAt(hero, pos);
    gameState.board.placeTrap(
      "test-game",
      pos.afterMove(Direction.DOWN),
      TrapType.SPEAR_TRAP,
    );

    await moveUnit(gameState.board, pos, Direction.DOWN, hero);

    expect(
      gameState.board.getTileAtPosition(pos.afterMove(Direction.DOWN))?.trap,
    ).toBeNull(); // trap should be removed after triggering
  });
});
