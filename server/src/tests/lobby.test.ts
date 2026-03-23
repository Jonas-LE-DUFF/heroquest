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

import { Game } from "../POO/classes/Server/Game";
import { Player } from "../POO/classes/Server/Player";
import { Hero } from "../POO/classes/Units/Hero";
import { Equipment } from "../POO/classes/Equipment/Equipment";
import { Position } from "../POO/classes/Position/Position";
import { GameState } from "../POO/classes/GameState";
import { PlayerRole } from "../POO/enums/PlayerRole";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { Stats } from "../POO/classes/Units/Stats";
import { getSpellsForElements } from "../services/SpellService";
import { SpellElement } from "../POO/enums/SpellElement";
import { TileType } from "../POO/enums/Board/TileType";

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

function createPlayer(
  name: string,
  role: PlayerRole = PlayerRole.HERO,
): Player {
  return new Player(name, role);
}

/**
 * Sets up a game with a GM and a given number of hero players (max 4),
 * each with a hero unit added to the game state.
 * @param heroCount Number of hero players to add (1–4, defaults to 1).
 * @returns The game, the GM player, an array of hero players, and their Hero units.
 */
function setupGameWithHeroes(heroCount: number = 1): {
  game: Game;
  gm: Player;
  heroPlayers: Player[];
  heroes: Hero[];
} {
  const game = new Game("test-game");
  game.gameState.board.getTileAtPosition(new Position(0, 0))!.type =
    TileType.SPAWN_POINT;

  const gm = createPlayer("GameMaster", PlayerRole.GAME_MASTER);
  game.addPlayer(gm);

  const categories = [
    HeroCategory.Barbarian,
    HeroCategory.Dwarf,
    HeroCategory.Elf,
    HeroCategory.Cleric,
  ];

  const heroPlayers: Player[] = [];
  const heroes: Hero[] = [];

  for (let i = 0; i < heroCount; i++) {
    const player = createPlayer(`Player${i + 1}`, PlayerRole.HERO);
    game.addPlayer(player);
    heroPlayers.push(player);

    const hero = createTestHero({
      controlledById: player.id,
      name: `Hero${i + 1}`,
      category: categories[i % categories.length]!,
    });
    game.gameState.addUnit(hero);
    heroes.push(hero);
  }

  return { game, gm, heroPlayers, heroes };
}

// ── Tests ──

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── 1. Join Game ───

describe("testJoinGame", () => {
  it("should allow a player to be added to a new game", () => {
    const game = new Game("test-game");
    const player = createPlayer("Alice");

    game.addPlayer(player);

    expect(game.hasPlayer(player.id)).toBe(true);
    expect(game.getAmountOfPlayers()).toBe(1);
  });

  it("should allow multiple players to be added (up to 5 with a GM)", () => {
    const game = new Game("test-game");
    const gm = createPlayer("GM", PlayerRole.GAME_MASTER);
    game.addPlayer(gm);

    for (let i = 0; i < 4; i++) {
      game.addPlayer(createPlayer(`Hero${i + 1}`, PlayerRole.HERO));
    }

    expect(game.getAmountOfPlayers()).toBe(5);
  });

  it("should throw when adding more than 5 players", () => {
    const game = new Game("test-game");
    const gm = createPlayer("GM", PlayerRole.GAME_MASTER);
    game.addPlayer(gm);

    for (let i = 0; i < 4; i++) {
      game.addPlayer(createPlayer(`Hero${i + 1}`, PlayerRole.HERO));
    }

    expect(() =>
      game.addPlayer(createPlayer("Extra", PlayerRole.HERO)),
    ).toThrow("Cannot add more than 5 players");
  });

  it("should throw when adding a second game master", () => {
    const game = new Game("test-game");
    game.addPlayer(createPlayer("GM1", PlayerRole.GAME_MASTER));

    expect(() =>
      game.addPlayer(createPlayer("GM2", PlayerRole.GAME_MASTER)),
    ).toThrow("A game master already exists");
  });

  it("should throw when adding a player after the game has started", () => {
    const { game } = setupGameWithHeroes(1);
    game.launchGame();

    expect(() =>
      game.addPlayer(createPlayer("LateJoiner", PlayerRole.HERO)),
    ).toThrow("Cannot join a game that has already started");
  });

  it("should throw when adding the same player twice", () => {
    const game = new Game("test-game");
    const player = createPlayer("Alice");
    game.addPlayer(player);

    expect(() => game.addPlayer(player)).toThrow("already exists");
  });

  it("should throw when adding more than 4 hero players without a GM", () => {
    const game = new Game("test-game");

    for (let i = 0; i < 4; i++) {
      game.addPlayer(createPlayer(`Hero${i + 1}`, PlayerRole.HERO));
    }

    // 5th hero without a GM should be rejected
    expect(() =>
      game.addPlayer(createPlayer("Hero5", PlayerRole.HERO)),
    ).toThrow("Cannot add more than 4 hero players");
  });
});

// ─── 2. Leave Lobby ───

describe("testLeaveLobby", () => {
  it("should remove a player from the game", () => {
    const game = new Game("test-game");
    const player = createPlayer("Alice");
    game.addPlayer(player);

    game.removePlayer(player.id);

    expect(game.getAmountOfPlayers()).toBe(0);
  });

  it("should return false for hasPlayer after removal", () => {
    const game = new Game("test-game");
    const player = createPlayer("Alice");
    game.addPlayer(player);

    game.removePlayer(player.id);

    expect(game.hasPlayer(player.id)).toBe(false);
  });

  it("should remove units controlled by the player via gameState", () => {
    const game = new Game("test-game");
    const player = createPlayer("Alice");
    game.addPlayer(player);

    const hero = createTestHero({
      controlledById: player.id,
      category: HeroCategory.Barbarian,
    });
    game.gameState.addUnit(hero);
    expect(game.gameState.Units).toContain(hero);

    game.removePlayer(player.id);

    // removePlayer calls gameState.removeUnitsControlledByPlayer
    expect(game.gameState.Units).not.toContain(hero);
  });
});

// ─── 3. Choose Character ───

describe("testChooseCharacter", () => {
  it("should add a hero to the GameState for a player", () => {
    const game = new Game("test-game");
    const player = createPlayer("Alice");
    game.addPlayer(player);

    const hero = createTestHero({
      controlledById: player.id,
      category: HeroCategory.Barbarian,
    });
    const pos = new Position(1, 1);
    game.gameState.addUnit(hero);

    expect(game.gameState.Units).toContain(hero);
  });

  it("should report a hero category as taken once chosen", () => {
    const gameState = new GameState();
    const hero = createTestHero({ category: HeroCategory.Elf });
    gameState.addUnit(hero);

    expect(gameState.isHeroCategoryTaken(HeroCategory.Elf)).toBe(true);
    expect(gameState.isHeroCategoryTaken(HeroCategory.Dwarf)).toBe(false);
  });

  it("should have valid stats (validateStats)", () => {
    const hero = createTestHero({
      stats: createTestStats({ health: 5, maxHealth: 10 }),
    });

    const result = hero.validateStats();
    expect(result.success).toBe(true);
  });

  it("should fail validateStats when health exceeds maxHealth", () => {
    const hero = createTestHero({
      stats: createTestStats({ health: 15, maxHealth: 10 }),
    });

    const result = hero.validateStats();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should fail validateStats when a stat is negative", () => {
    const hero = createTestHero({
      stats: createTestStats({ movements: -1 }),
    });

    const result = hero.validateStats();
    expect(result.success).toBe(false);
    expect(result.error).toBe("Stats cannot be negative");
  });
});

// ─── 4. Unselect Character ───

describe("testUnselectCharacter", () => {
  it("should remove a hero from GameState after unselecting", () => {
    const gameState = new GameState();
    const hero = createTestHero({ category: HeroCategory.Barbarian });
    gameState.addUnit(hero);

    expect(gameState.Units).toContain(hero);

    gameState.removeUnit(hero);

    expect(gameState.getUnitById(hero.id)).toBeUndefined();
  });

  it("should no longer include the hero in GameState.Units", () => {
    const gameState = new GameState();
    const hero = createTestHero({ category: HeroCategory.Dwarf });
    gameState.addUnit(hero);

    gameState.removeUnit(hero);

    expect(gameState.Units).not.toContain(hero);
    expect(gameState.isHeroCategoryTaken(HeroCategory.Dwarf)).toBe(false);
  });
});

// ─── 5. Start Game ───

describe("testStartGame", () => {
  it("should launch successfully with a GM and at least one hero", () => {
    const { game } = setupGameWithHeroes(1);

    expect(() => game.launchGame()).not.toThrow();
  });

  it("should set gameState.status to 'playing' after launch", () => {
    const { game } = setupGameWithHeroes(1);
    game.launchGame();

    expect(game.gameState.status).toBe("playing");
  });

  it("should throw when launching without a game master", () => {
    const game = new Game("test-game");
    const player = createPlayer("Hero1", PlayerRole.HERO);
    game.addPlayer(player);

    const hero = createTestHero({
      controlledById: player.id,
      category: HeroCategory.Barbarian,
    });
    game.gameState.addUnit(hero);

    expect(() => game.launchGame()).toThrow(
      "A game master is required to start the game",
    );
  });

  it("should throw when launching without any heroes", () => {
    const game = new Game("test-game");
    const gm = createPlayer("GM", PlayerRole.GAME_MASTER);
    game.addPlayer(gm);

    // No heroes added to gameState
    expect(() => game.launchGame()).toThrow();
  });

  it("should establish a turn order after launch", () => {
    const { game } = setupGameWithHeroes(2);
    game.launchGame();

    expect(game.playOrder.length).toBe(2);
    expect(game.isMonsterTurn).toBe(true);
    expect(game.currentTurnIndex).toBe(0);
  });

  it("should include all hero categories in the play order", () => {
    const { game, heroes } = setupGameWithHeroes(3);
    game.launchGame();

    for (const hero of heroes) {
      expect(game.playOrder).toContain(hero.category);
    }
  });

  it("should throw if the same spell element is chosen for different heroes", () => {
    const game = new Game("test-game");
    const gm = createPlayer("GM", PlayerRole.GAME_MASTER);
    game.addPlayer(gm);

    const hero1 = createTestHero({
      controlledById: "player-1",
      name: "Hero1",
      category: HeroCategory.Barbarian,
      stats: createTestStats(),
    });
    hero1.setSpells(
      getSpellsForElements(game.id, [SpellElement.Air, SpellElement.Earth]),
    );
    const hero2 = createTestHero({
      controlledById: "player-1",
      name: "Hero1",
      category: HeroCategory.Barbarian,
      stats: createTestStats(),
    });
    hero2.setSpells(
      getSpellsForElements(game.id, [SpellElement.Air, SpellElement.Fire]),
    );
    game.gameState.addUnit(hero1);
    game.gameState.addUnit(hero2);

    expect(() => game.launchGame()).toThrow(
      "The same spell element cannot be chosen for different heroes.",
    );
  });
});
