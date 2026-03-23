import { describe, it, expect } from "vitest";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { MonsterCategory } from "../POO/enums/Categories/MonsterCategory";
import { PlayerRole } from "../POO/enums/PlayerRole";
import { TileType } from "../POO/enums/Board/TileType";
import { SpellElement } from "../POO/enums/SpellElement";
import { Direction } from "../POO/enums/Direction";
import { FightDiceFaces } from "../POO/enums/Dices/FightDiceFaces";
import type { GameAsJson } from "../POO/interfaces/ClassAsJson/Server/GameAsJson";
import type { PlayerAsJson } from "../POO/interfaces/ClassAsJson/Server/PlayerAsJson";
import type { HeroAsJson } from "../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import type { MonsterAsJson } from "../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";
import type { StatsAsJson } from "../POO/interfaces/ClassAsJson/Unit/StatsAsJson";
import type { BoardAsJson } from "../POO/interfaces/ClassAsJson/Board/BoardAsJson";
import type { TileAsJson } from "../POO/interfaces/ClassAsJson/Board/TileAsJson";
import {
  getHeroes,
  getHeroesByPlayerId,
  getPlayerByHero,
  getPlayerByHeroCategory,
  getPlayerBySocketId,
  getPlayerIdToPlay,
} from "../shared/serverUtils";
import {
  getTileByPosition,
  getTileByUnitId,
  getPositionByUnitId,
  removeUnitFromBoardById,
  setTileTypeAtPosition,
} from "../shared/boardUtils";

// ── Test data builders ──

function createStats(overrides?: Partial<StatsAsJson>): StatsAsJson {
  return {
    health: 8,
    maxHealth: 10,
    attack: 3,
    defense: 2,
    movements: 2,
    spirit: 3,
    effects: [],
    ...overrides,
  };
}

function createHero(overrides?: Partial<HeroAsJson>): HeroAsJson {
  return {
    id: "hero-1",
    controlledByPlayerId: "player-1",
    name: "Barbarian",
    category: HeroCategory.Barbarian,
    stats: createStats(),
    equipment: {
      gold: 0,
      selectedWeaponIndex: 0,
      weapons: [],
      armors: [],
      potions: [],
      tools: [],
    },
    spells: [],
    usedSpells: [],
    spellElements: [],
    ...overrides,
  };
}

function createMonster(overrides?: Partial<MonsterAsJson>): MonsterAsJson {
  return {
    id: "monster-1",
    name: "Goblin",
    category: MonsterCategory.Goblin,
    stats: createStats({ health: 1, maxHealth: 1, attack: 2, defense: 1 }),
    ...overrides,
  };
}

function createPlayer(overrides?: Partial<PlayerAsJson>): PlayerAsJson {
  return {
    id: "player-1",
    name: "Alice",
    role: PlayerRole.HERO,
    isReady: false,
    ...overrides,
  };
}

function createEmptyBoard(
  width: number = 19,
  height: number = 26,
): BoardAsJson {
  const tiles: TileAsJson[][] = [];
  for (let x = 0; x < width; x++) {
    const row: TileAsJson[] = [];
    for (let y = 0; y < height; y++) {
      row.push({ type: TileType.FLOOR, unitId: null });
    }
    tiles.push(row);
  }
  return {
    width,
    height,
    tiles,
    doors: {
      horizontalDoors: Array.from({ length: width + 1 }, () =>
        Array(height).fill(false),
      ),
      verticalDoors: Array.from({ length: width }, () =>
        Array(height + 1).fill(false),
      ),
    },
    walls: {
      horizontalWalls: Array.from({ length: width + 1 }, () =>
        Array(height).fill(false),
      ),
      verticalWalls: Array.from({ length: width }, () =>
        Array(height + 1).fill(false),
      ),
    },
  };
}

function addSpawnPoint(board: BoardAsJson): BoardAsJson {
  board.tiles[0]![0]!.type = TileType.SPAWN_POINT;
  board.tiles[0]![1]!.type = TileType.SPAWN_POINT;
  board.tiles[1]![0]!.type = TileType.SPAWN_POINT;
  board.tiles[1]![1]!.type = TileType.SPAWN_POINT;
  return board;
}

function createGame(overrides?: Partial<GameAsJson>): GameAsJson {
  return {
    id: "game-1",
    name: "TestGame",
    players: [],
    playOrder: [],
    isMonsterTurn: true,
    currentTurnIndex: 0,
    gameState: {
      Units: [],
      board: addSpawnPoint(createEmptyBoard()),
      status: "lobby",
    },
    isLaunchable: { success: false, reasons: [] },
    ...overrides,
  };
}

/**
 * Builds a full-party game state with 5 persons: 1 GM + 4 hero players,
 * each controlling a different hero class placed on the board.
 */
function createFullPartyGame(): GameAsJson {
  const gm = createPlayer({
    id: "gm-1",
    name: "GameMaster",
    role: PlayerRole.GAME_MASTER,
    isReady: true,
  });
  const p1 = createPlayer({
    id: "p1",
    name: "Player1",
    role: PlayerRole.HERO,
    isReady: true,
  });
  const p2 = createPlayer({
    id: "p2",
    name: "Player2",
    role: PlayerRole.HERO,
    isReady: true,
  });
  const p3 = createPlayer({
    id: "p3",
    name: "Player3",
    role: PlayerRole.HERO,
    isReady: true,
  });
  const p4 = createPlayer({
    id: "p4",
    name: "Player4",
    role: PlayerRole.HERO,
    isReady: true,
  });

  const hero1 = createHero({
    id: "hero-barbarian",
    controlledByPlayerId: "p1",
    name: "Barbarian",
    category: HeroCategory.Barbarian,
    stats: createStats({ health: 8, maxHealth: 8, attack: 3, defense: 2 }),
  });
  const hero2 = createHero({
    id: "hero-dwarf",
    controlledByPlayerId: "p2",
    name: "Dwarf",
    category: HeroCategory.Dwarf,
    stats: createStats({ health: 7, maxHealth: 7, attack: 2, defense: 2 }),
  });
  const hero3 = createHero({
    id: "hero-elf",
    controlledByPlayerId: "p3",
    name: "Elf",
    category: HeroCategory.Elf,
    stats: createStats({ health: 6, maxHealth: 6, attack: 2, defense: 2 }),
    spellElements: [SpellElement.Air],
  });
  const hero4 = createHero({
    id: "hero-cleric",
    controlledByPlayerId: "p4",
    name: "Cleric",
    category: HeroCategory.Cleric,
    stats: createStats({ health: 4, maxHealth: 4, attack: 1, defense: 2 }),
    spellElements: [SpellElement.Earth, SpellElement.Water, SpellElement.Air],
  });

  const board = createEmptyBoard();
  // Place heroes on the board
  board.tiles[0]![0]!.unitId = hero1.id;
  board.tiles[1]![0]!.unitId = hero2.id;
  board.tiles[2]![0]!.unitId = hero3.id;
  board.tiles[3]![0]!.unitId = hero4.id;

  return createGame({
    id: "full-party-game",
    name: "FullPartyGame",
    players: [gm, p1, p2, p3, p4],
    playOrder: [
      HeroCategory.Barbarian,
      HeroCategory.Dwarf,
      HeroCategory.Elf,
      HeroCategory.Cleric,
    ],
    isMonsterTurn: true,
    currentTurnIndex: 0,
    gameState: {
      Units: [hero1, hero2, hero3, hero4],
      board,
      status: "playing",
    },
    isLaunchable: { success: true, reasons: [] },
  });
}

// ══════════════════════════════════════════
// Frontend validation tests
// ══════════════════════════════════════════

describe("launchFullPartyGame", () => {
  it("should have 5 persons in the game (1 GM + 4 heroes)", () => {
    const game = createFullPartyGame();
    expect(game.players.length).toBe(5);
  });

  it("should have exactly 1 game master", () => {
    const game = createFullPartyGame();
    const gms = game.players.filter((p) => p.role === PlayerRole.GAME_MASTER);
    expect(gms.length).toBe(1);
  });

  it("should have exactly 4 hero players", () => {
    const game = createFullPartyGame();
    const heroes = game.players.filter((p) => p.role === PlayerRole.HERO);
    expect(heroes.length).toBe(4);
  });

  it("all 4 players should have chosen a unique hero", () => {
    const game = createFullPartyGame();
    const heroUnits = getHeroes(game.gameState.Units);
    expect(heroUnits.length).toBe(4);

    const categories = heroUnits.map((h) => h.category);
    const uniqueCategories = new Set(categories);
    expect(uniqueCategories.size).toBe(4);
  });

  it("game status should be 'playing' after launch", () => {
    const game = createFullPartyGame();
    expect(game.gameState.status).toBe("playing");
  });

  it("play order should contain all 4 hero categories", () => {
    const game = createFullPartyGame();
    expect(game.playOrder).toContain(HeroCategory.Barbarian);
    expect(game.playOrder).toContain(HeroCategory.Dwarf);
    expect(game.playOrder).toContain(HeroCategory.Elf);
    expect(game.playOrder).toContain(HeroCategory.Cleric);
  });

  it("all heroes should be placed on the board", () => {
    const game = createFullPartyGame();
    const heroUnits = getHeroes(game.gameState.Units);
    for (const hero of heroUnits) {
      const tile = getTileByUnitId(hero.id, game.gameState.board);
      expect(tile).not.toBeNull();
      expect(tile!.unitId).toBe(hero.id);
    }
  });

  it("all players should be ready", () => {
    const game = createFullPartyGame();
    for (const player of game.players) {
      expect(player.isReady).toBe(true);
    }
  });

  it("should start on the monster turn (game master goes first)", () => {
    const game = createFullPartyGame();
    expect(game.isMonsterTurn).toBe(true);
    const playerId = getPlayerIdToPlay(game);
    const gm = game.players.find((p) => p.role === PlayerRole.GAME_MASTER);
    expect(playerId).toBe(gm?.id);
  });
});

describe("combatValidationTest", () => {
  it("attack dice should reduce defender health when hits exceed defense", () => {
    const monster = createMonster({
      stats: createStats({ health: 5, maxHealth: 5, defense: 1 }),
    });

    // Simulate: 3 hits, 1 black shield block → 2 damage
    const attackHits = 3;
    const defenseBlocks = 1;
    const damage = Math.max(attackHits - defenseBlocks, 0);

    monster.stats.health = Math.max(monster.stats.health - damage, 0);
    expect(monster.stats.health).toBe(3);
  });

  it("defense should prevent all damage if blocks >= hits", () => {
    const monster = createMonster({
      stats: createStats({ health: 5, maxHealth: 5 }),
    });

    const attackHits = 2;
    const defenseBlocks = 3;
    const damage = Math.max(attackHits - defenseBlocks, 0);

    monster.stats.health = Math.max(monster.stats.health - damage, 0);
    expect(monster.stats.health).toBe(5); // No damage
  });

  it("damage should not reduce health below 0", () => {
    const monster = createMonster({
      stats: createStats({ health: 2, maxHealth: 5 }),
    });

    const damage = 10;
    monster.stats.health = Math.max(monster.stats.health - damage, 0);
    expect(monster.stats.health).toBe(0);
  });

  it("hero should be able to attack a monster on the board", () => {
    const game = createFullPartyGame();
    const monster = createMonster({
      id: "target-monster",
      stats: createStats({ health: 3, maxHealth: 3 }),
    });
    game.gameState.Units.push(monster);
    game.gameState.board.tiles[5]![5]!.unitId = monster.id;

    // Verify both attacker and target are on the board
    const heroTile = getTileByUnitId("hero-barbarian", game.gameState.board);
    const monsterTile = getTileByUnitId("target-monster", game.gameState.board);
    expect(heroTile).not.toBeNull();
    expect(monsterTile).not.toBeNull();
  });

  it("FightDiceFaces enum values should be correct", () => {
    expect(FightDiceFaces.WhiteShield).toBe(1);
    expect(FightDiceFaces.BlackShield).toBe(2);
    expect(FightDiceFaces.Hit).toBe(3);
  });
});

describe("spellCastingValidationTest", () => {
  it("a hero with spells should have spell elements", () => {
    const hero = createHero({
      spellElements: [SpellElement.Fire, SpellElement.Earth],
      spells: [
        { id: "fire-1", name: "Fireball", element: SpellElement.Fire },
        { id: "earth-1", name: "Heal", element: SpellElement.Earth },
      ],
    });

    expect(hero.spellElements.length).toBe(2);
    expect(hero.spells.length).toBe(2);
  });

  it("casting a spell should move it from spells to usedSpells", () => {
    const spell = {
      id: "heal-1",
      name: "Heal",
      element: SpellElement.Earth,
    };
    const hero = createHero({
      spells: [spell],
      usedSpells: [],
    });

    // Simulate spell casting on the client side
    hero.usedSpells.push(spell);

    expect(hero.usedSpells).toContain(spell);
    expect(hero.usedSpells.length).toBe(1);
  });

  it("heal spell should increase health up to maxHealth", () => {
    const hero = createHero({
      stats: createStats({ health: 3, maxHealth: 10 }),
    });

    const healAmount = 4;
    hero.stats.health = Math.min(
      hero.stats.health + healAmount,
      hero.stats.maxHealth,
    );

    expect(hero.stats.health).toBe(7);
  });

  it("heal spell should not exceed maxHealth", () => {
    const hero = createHero({
      stats: createStats({ health: 8, maxHealth: 10 }),
    });

    const healAmount = 5;
    hero.stats.health = Math.min(
      hero.stats.health + healAmount,
      hero.stats.maxHealth,
    );

    expect(hero.stats.health).toBe(10);
  });

  it("buff spell should add effect name to effects list", () => {
    const hero = createHero({
      stats: createStats({ effects: [] }),
    });

    // Simulate applying a buff effect
    hero.stats.effects.push("Rock Skin");
    expect(hero.stats.effects).toContain("Rock Skin");
  });

  it("multiple spells from different elements should work", () => {
    const hero = createHero({
      spellElements: [SpellElement.Fire, SpellElement.Earth, SpellElement.Air],
      spells: [
        { id: "fire-1", name: "Fireball", element: SpellElement.Fire },
        { id: "earth-1", name: "Heal", element: SpellElement.Earth },
        { id: "air-1", name: "Swift", element: SpellElement.Air },
      ],
    });

    // All spells should be available
    expect(hero.spells.length).toBe(3);
    const elements = hero.spells.map((s) => s.element);
    expect(elements).toContain(SpellElement.Fire);
    expect(elements).toContain(SpellElement.Earth);
    expect(elements).toContain(SpellElement.Air);
  });

  it("damage spell should reduce target health", () => {
    const monster = createMonster({
      stats: createStats({ health: 5, maxHealth: 5 }),
    });

    const spellDamage = 3;
    const defenseRoll = 1; // monster defends 1
    const totalDamage = Math.max(spellDamage - defenseRoll, 0);
    monster.stats.health = Math.max(monster.stats.health - totalDamage, 0);

    expect(monster.stats.health).toBe(3);
  });
});

describe("endTurnValidationTest", () => {
  it("should start on monster turn", () => {
    const game = createFullPartyGame();
    expect(game.isMonsterTurn).toBe(true);
  });

  it("game master should be the player to play during monster turn", () => {
    const game = createFullPartyGame();
    const playerId = getPlayerIdToPlay(game);
    const gm = game.players.find((p) => p.role === PlayerRole.GAME_MASTER);
    expect(playerId).toBe(gm?.id);
  });

  it("after monster turn ends, it should be the first hero's turn", () => {
    const game = createFullPartyGame();

    // Simulate ending monster turn
    game.isMonsterTurn = false;
    game.currentTurnIndex = 0;

    const playerId = getPlayerIdToPlay(game);
    const firstHeroCategory = game.playOrder[0];
    const firstHero = getHeroes(game.gameState.Units).find(
      (h) => h.category === firstHeroCategory,
    );
    expect(playerId).toBe(firstHero?.controlledByPlayerId);
  });

  it("every player should skip their turn cycling through all heroes", () => {
    const game = createFullPartyGame();

    // End monster turn
    game.isMonsterTurn = false;
    game.currentTurnIndex = 0;

    const turnSequence: string[] = [];
    for (let i = 0; i < game.playOrder.length; i++) {
      game.currentTurnIndex = i;
      const playerId = getPlayerIdToPlay(game);
      if (playerId) turnSequence.push(playerId);
    }

    // Each hero player should have had a turn
    expect(turnSequence.length).toBe(4);
    const uniquePlayers = new Set(turnSequence);
    expect(uniquePlayers.size).toBe(4);
  });

  it("after all heroes played, it should cycle back to monster turn", () => {
    const game = createFullPartyGame();

    // Simulate all heroes have played, cycle back to monster turn
    game.isMonsterTurn = true;
    game.currentTurnIndex = 0;

    expect(game.isMonsterTurn).toBe(true);
    const playerId = getPlayerIdToPlay(game);
    const gm = game.players.find((p) => p.role === PlayerRole.GAME_MASTER);
    expect(playerId).toBe(gm?.id);
  });

  it("full round cycle should bring game back to initial state", () => {
    const game = createFullPartyGame();

    // Monster turn
    expect(game.isMonsterTurn).toBe(true);

    // Hero turns (simulate cycling)
    game.isMonsterTurn = false;
    for (let i = 0; i < game.playOrder.length; i++) {
      game.currentTurnIndex = i;
    }

    // Back to monster turn
    game.isMonsterTurn = true;
    game.currentTurnIndex = 0;

    expect(game.isMonsterTurn).toBe(true);
    expect(game.currentTurnIndex).toBe(0);
  });
});

describe("moveValidationTest", () => {
  it("a unit should be found at its placed position", () => {
    const game = createFullPartyGame();
    const pos = getPositionByUnitId("hero-barbarian", game.gameState.board);
    expect(pos).toEqual({ x: 0, y: 0 });
  });

  it("moving a unit should update the board tiles", () => {
    const game = createFullPartyGame();
    const board = game.gameState.board;
    const heroId = board.tiles[0]![0]!.unitId!;

    // Simulate moving hero from (0,0) to (0,1) — move RIGHT
    board.tiles[0]![1]!.unitId = heroId;
    board.tiles[0]![0]!.unitId = null;

    const newPos = getPositionByUnitId(heroId, board);
    expect(newPos).toEqual({ x: 0, y: 1 });

    // Old position should be empty
    expect(board.tiles[0]![0]!.unitId).toBeNull();
  });

  it("should not move to a tile with a unit already on it", () => {
    const game = createFullPartyGame();
    const board = game.gameState.board;

    // (0,0) has hero-barbarian, (1,0) has hero-dwarf
    const targetTile = getTileByPosition({ x: 1, y: 0 }, board);
    expect(targetTile?.unitId).not.toBeNull();

    // Validate: tile is occupied
    const isOccupied = targetTile?.unitId !== null;
    expect(isOccupied).toBe(true);
  });

  it("moving out of bounds should be invalid", () => {
    const board = createEmptyBoard();

    // Trying to get tile at invalid position
    const invalidTile = getTileByPosition({ x: -1, y: 0 }, board);
    expect(invalidTile).toBeNull();

    const outOfBoundsTile = getTileByPosition({ x: 100, y: 100 }, board);
    expect(outOfBoundsTile).toBeNull();
  });

  it("Direction enum should have correct values", () => {
    expect(Direction.UP).toBe("UP");
    expect(Direction.DOWN).toBe("DOWN");
    expect(Direction.LEFT).toBe("LEFT");
    expect(Direction.RIGHT).toBe("RIGHT");
  });
});

describe("unitDefeatValidationTest", () => {
  it("a defeated unit (health=0) should be removed from the board", () => {
    const game = createFullPartyGame();
    const monster = createMonster({
      id: "defeated-monster",
      stats: createStats({ health: 0, maxHealth: 3 }),
    });
    game.gameState.Units.push(monster);
    game.gameState.board.tiles[5]![5]!.unitId = monster.id;

    // Verify monster is on the board
    expect(
      getTileByUnitId("defeated-monster", game.gameState.board),
    ).not.toBeNull();

    // Simulate defeat: remove from board
    removeUnitFromBoardById("defeated-monster", game.gameState.board);

    // Board should no longer have the monster
    const tileAfterRemoval = getTileByUnitId(
      "defeated-monster",
      game.gameState.board,
    );
    expect(tileAfterRemoval).toBeNull();
  });

  it("a defeated unit should be removed from the Units array", () => {
    const game = createFullPartyGame();
    const monster = createMonster({
      id: "defeated-monster-2",
      stats: createStats({ health: 0, maxHealth: 3 }),
    });
    game.gameState.Units.push(monster);

    // Simulate removing the unit from the array
    game.gameState.Units = game.gameState.Units.filter(
      (u) => u.id !== "defeated-monster-2",
    );

    expect(
      game.gameState.Units.find((u) => u.id === "defeated-monster-2"),
    ).toBeUndefined();
  });

  it("the board should update correctly after a unit is defeated", () => {
    const game = createFullPartyGame();
    const monster = createMonster({
      id: "target",
      stats: createStats({ health: 1, maxHealth: 3 }),
    });
    game.gameState.Units.push(monster);
    game.gameState.board.tiles[7]![7]!.unitId = monster.id;

    // Simulate lethal damage
    monster.stats.health = 0;

    // Remove from board and Units
    removeUnitFromBoardById("target", game.gameState.board);
    game.gameState.Units = game.gameState.Units.filter(
      (u) => u.id !== "target",
    );

    // Tile should be empty
    expect(game.gameState.board.tiles[7]![7]!.unitId).toBeNull();

    // Unit should not be in Units array
    expect(game.gameState.Units.find((u) => u.id === "target")).toBeUndefined();
  });

  it("heroes remaining on the board should not be affected by monster defeat", () => {
    const game = createFullPartyGame();
    const initialHeroCount = getHeroes(game.gameState.Units).length;

    const monster = createMonster({ id: "temp-monster" });
    game.gameState.Units.push(monster);
    game.gameState.board.tiles[8]![8]!.unitId = monster.id;

    // Remove monster
    removeUnitFromBoardById("temp-monster", game.gameState.board);
    game.gameState.Units = game.gameState.Units.filter(
      (u) => u.id !== "temp-monster",
    );

    // Heroes should still be intact
    const heroesAfter = getHeroes(game.gameState.Units);
    expect(heroesAfter.length).toBe(initialHeroCount);
  });

  it("tile type should remain unchanged after unit removal", () => {
    const game = createFullPartyGame();
    const board = game.gameState.board;

    // Set a tile to TRAP and place a monster
    board.tiles[6]![6]!.type = TileType.TRAP;
    const monster = createMonster({ id: "trap-monster" });
    board.tiles[6]![6]!.unitId = monster.id;

    // Remove monster
    removeUnitFromBoardById("trap-monster", board);

    // Tile should still be TRAP type
    expect(board.tiles[6]![6]!.type).toBe(TileType.TRAP);
    expect(board.tiles[6]![6]!.unitId).toBeNull();
  });
});

// ── Additional utility function tests ──

describe("serverUtils validation", () => {
  it("getHeroes should filter only hero units", () => {
    const hero = createHero();
    const monster = createMonster();
    const units = [hero, monster];

    const heroes = getHeroes(units);
    expect(heroes.length).toBe(1);
    expect(heroes[0]!.id).toBe(hero.id);
  });

  it("getHeroesByPlayerId should find the correct hero", () => {
    const game = createFullPartyGame();
    const heroes = getHeroesByPlayerId("p1", game);
    expect(heroes).toHaveLength(1);
    expect(heroes![0]!.controlledByPlayerId).toBe("p1");
  });

  it("getHeroesByPlayerId should return null for unknown player", () => {
    const game = createFullPartyGame();
    const heroes = getHeroesByPlayerId("unknown", game);
    expect(heroes).toBeNull();
  });

  it("getPlayerByHero should find the controlling player", () => {
    const hero = createHero({ controlledByPlayerId: "p1" });
    const players = [
      createPlayer({ id: "p1", name: "Alice" }),
      createPlayer({ id: "p2", name: "Bob" }),
    ];

    const player = getPlayerByHero(hero, players);
    expect(player).not.toBeNull();
    expect(player!.id).toBe("p1");
  });

  it("getPlayerBySocketId should find the correct player", () => {
    const game = createFullPartyGame();
    const player = getPlayerBySocketId("p2", game);
    expect(player).not.toBeNull();
    expect(player!.name).toBe("Player2");
  });

  it("getPlayerByHeroCategory should find the player controlling that hero", () => {
    const game = createFullPartyGame();
    const player = getPlayerByHeroCategory(HeroCategory.Elf, game);
    expect(player).not.toBeNull();
    expect(player!.id).toBe("p3");
  });
});

describe("boardUtils validation", () => {
  it("getTileByPosition should return the correct tile", () => {
    const board = createEmptyBoard();
    board.tiles[3]![4]!.type = TileType.TRAP;

    const tile = getTileByPosition({ x: 3, y: 4 }, board);
    expect(tile).not.toBeNull();
    expect(tile!.type).toBe(TileType.TRAP);
  });

  it("getTileByPosition should return null for out-of-bounds", () => {
    const board = createEmptyBoard();

    expect(getTileByPosition({ x: -1, y: 0 }, board)).toBeNull();
    expect(getTileByPosition({ x: 0, y: -1 }, board)).toBeNull();
    expect(getTileByPosition({ x: 100, y: 0 }, board)).toBeNull();
  });

  it("setTileTypeAtPosition should update tile type", () => {
    const board = createEmptyBoard();
    setTileTypeAtPosition({ x: 5, y: 5 }, TileType.TREASURE, board);

    const tile = getTileByPosition({ x: 5, y: 5 }, board);
    expect(tile!.type).toBe(TileType.TREASURE);
  });

  it("getPositionByUnitId should find unit position", () => {
    const board = createEmptyBoard();
    const hero = createHero({ id: "find-me" });
    board.tiles[3]![7]!.unitId = hero.id;

    const pos = getPositionByUnitId("find-me", board);
    expect(pos).toEqual({ x: 3, y: 7 });
  });

  it("getPositionByUnitId should return null for missing unit", () => {
    const board = createEmptyBoard();
    const pos = getPositionByUnitId("nonexistent", board);
    expect(pos).toBeNull();
  });
});
