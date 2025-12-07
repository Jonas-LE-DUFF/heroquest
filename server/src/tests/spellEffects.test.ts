import {
  castSpell,
  getSpell,
  getSpellSchool,
} from "../shared/spell/spellEffects";
import {
  GameState,
  Monster,
  Player,
  Position,
  spellElement,
  Unit,
} from "../shared/type";
import { Server } from "socket.io";

// Mock dependencies
jest.mock("../shared/game_cards/spells.json", () => [
  {
    id: "heal-spell-1",
    name: "Heal",
    school: "Earth",
    image_path: "/assets/spells/heal.png",
    range: "any",
    target_type: "self hero",
    effect: {
      type: "heal",
      stat: "hp",
      value: "+5",
      comment: "Restore 5 HP",
    },
  },
  {
    id: "buff-spell-1",
    name: "Strength Buff",
    school: "Fire",
    image_path: "/assets/spells/buff.png",
    range: "3",
    target_type: "single",
    effect: {
      type: "buff",
      stat: "nbAttackDice",
      value: "+2",
      comment: "Increase attack dice by 2",
    },
  },
  {
    id: "damage-spell-1",
    name: "Fireball",
    school: "Fire",
    image_path: "/assets/spells/fireball.png",
    range: "4",
    target_type: "monster",
    effect: {
      type: "damage",
      stat: "",
      value: "-3",
      comment: "monster roll red dices",
    },
  },
]);

jest.mock("../shared/util", () => ({
  checkOnlyOneGameMaster: jest.fn(),
  positionKey: (pos: Position) => `${pos.x},${pos.y}`,
}));

jest.mock("../shared/death/death", () => ({
  checkMonsterDefeat: jest.fn((gameState) => null),
}));

jest.mock("../shared/spell/range", () => ({
  isPositionVisible: jest.fn((from: Position, to: Position) => true),
}));

jest.mock("../shared/dicesControllers", () => ({
  rollRedDice: jest.fn().mockResolvedValue({
    success: true,
    results: [3, 4, 5, 6],
  }),
}));

// Helper to create a mock GameState
function createMockGameState(): GameState {
  return {
    entityPositions: new Map(),
    positionEntities: new Map(),
    monsters: new Map(),
    players: new Map(),
    tiles: [],
    turnOrder: ["player1", "player2", "player3", "player4", "gameMaster"],
    gameId: "test-game-1",
    currentTurn: 0,
    isGameActive: true,
  } as any as GameState;
}

// Helper to create a mock Player
function createMockPlayer(
  id: string = "player1",
  spells: spellElement[] = []
): Player {
  const stats: Unit = {
    nbAttackDice: 2,
    nbDefenseDice: 1,
    hp: 10,
    maxHp: 10,
    spiritPoints: 5,
    name: "Test Player",
    gold: 50,
    spells: spells,
    equipments: [],
  };

  return {
    id,
    class: 0,
    stats,
    hasPlayed: false,
    socketId: id,
  } as any as Player;
}

describe("castSpell", () => {
  let mockIo: jest.Mocked<Server>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIo = {
      emit: jest.fn(),
    } as any;
  });

  describe("Validation", () => {
    it("should throw if spell not found", async () => {
      const gameState = createMockGameState();
      const player = createMockPlayer();
      const position: Position = { x: 0, y: 0 };

      await expect(
        castSpell(gameState, player, "invalid-spell-id", position, mockIo)
      ).rejects.toThrow("Spell not found");
    });

    it("should throw if player has no stats", async () => {
      const gameState = createMockGameState();
      const player = createMockPlayer();
      player.stats = undefined;
      const position: Position = { x: 0, y: 0 };

      await expect(
        castSpell(gameState, player, "heal-spell-1", position, mockIo)
      ).rejects.toThrow("Player stats not found");
    });

    it("should throw if player does not know the spell school", async () => {
      const gameState = createMockGameState();
      const player = createMockPlayer("player1", []); // No spells
      const position: Position = { x: 0, y: 0 };

      await expect(
        castSpell(gameState, player, "heal-spell-1", position, mockIo)
      ).rejects.toThrow("Player does not know this spell");
    });

    it("should throw if player already used the spell", async () => {
      const gameState = createMockGameState();
      const player = createMockPlayer("player1", [spellElement.Earth]);
      player.stats!.usedSpells = ["heal-spell-1"];
      const position: Position = { x: 0, y: 0 };

      await expect(
        castSpell(gameState, player, "heal-spell-1", position, mockIo)
      ).rejects.toThrow("Player already used this spell");
    });

    it("should throw if player position not found", async () => {
      const gameState = createMockGameState();
      const player = createMockPlayer("player1", [spellElement.Earth]);
      const position: Position = { x: 0, y: 0 };

      await expect(
        castSpell(gameState, player, "heal-spell-1", position, mockIo)
      ).rejects.toThrow("Player position not found");
    });

    it("should throw if target position is not visible", async () => {
      const gameState = createMockGameState();
      const player = createMockPlayer("player1", [spellElement.Earth]);
      const playerPos: Position = { x: 0, y: 0 };
      const targetPos: Position = { x: 10, y: 10 };

      gameState.entityPositions.set("player1", playerPos);

      const { isPositionVisible } = require("./range");
      isPositionVisible.mockReturnValue(false);

      await expect(
        castSpell(gameState, player, "heal-spell-1", targetPos, mockIo)
      ).rejects.toThrow("Target position is not visible");
    });

    it("should throw if no target found and spell requires one", async () => {
      const gameState = createMockGameState();
      const player = createMockPlayer("player1", [spellElement.Fire]);
      const playerPos: Position = { x: 0, y: 0 };
      const targetPos: Position = { x: 1, y: 1 };

      gameState.entityPositions.set("player1", playerPos);

      await expect(
        castSpell(gameState, player, "buff-spell-1", targetPos, mockIo)
      ).rejects.toThrow("No target found at the specified position");
    });
  });

  describe("Spell Effects", () => {
    it("should heal player correctly", async () => {
      const gameState = createMockGameState();
      const player = createMockPlayer("player1", [spellElement.Earth]);
      player.stats!.hp = 5; // Damaged
      const playerPos: Position = { x: 0, y: 0 };

      gameState.entityPositions.set("player1", playerPos);
      gameState.positionEntities.set("0,0", player.id);

      await castSpell(gameState, player, "heal-spell-1", playerPos, mockIo);

      expect(player.stats!.hp).toBe(10); // 5 + 5, capped at maxHp of 10
    });

    it("should not exceed maxHp when healing", async () => {
      const gameState = createMockGameState();
      const player = createMockPlayer("player1", [spellElement.Earth]);
      player.stats!.hp = 8;
      const playerPos: Position = { x: 0, y: 0 };

      gameState.entityPositions.set("player1", playerPos);
      gameState.positionEntities.set("0,0", player.id);

      await castSpell(gameState, player, "heal-spell-1", playerPos, mockIo);

      expect(player.stats!.hp).toBe(10); // Capped at maxHp
    });

    it("should apply buff with addition operator", async () => {
      const gameState = createMockGameState();
      const player = createMockPlayer("player1", [spellElement.Fire]);
      player.stats!.nbAttackDice = 2;
      const playerPos: Position = { x: 0, y: 0 };

      gameState.entityPositions.set("player1", playerPos);
      gameState.positionEntities.set("0,0", player.id);

      await castSpell(gameState, player, "buff-spell-1", playerPos, mockIo);

      expect(player.stats!.nbAttackDice).toBe(4); // 2 + 2
    });
  });

  describe("damage spell", () => {
    it("should apply damage to monster", async () => {
      const gameState = createMockGameState();
      const player = createMockPlayer("player1", [spellElement.Fire]);
      const playerPos: Position = { x: 0, y: 0 };
      const monster = {
        id: "monster1",
        stats: {
          hp: 10,
          maxHp: 10,
        },
      } as Monster;
      const monsterPos: Position = { x: 1, y: 1 };
      gameState.entityPositions.set("player1", playerPos);
      gameState.positionEntities.set("0,0", player.id);
      gameState.entityPositions.set("monster1", monsterPos);
      gameState.positionEntities.set("1,1", monster.id);
      gameState.monsters.set("monster1", monster);
      await castSpell(gameState, player, "damage-spell-1", monsterPos, mockIo);

      // Initial damage is 3, but two dice rolled 5 and 6, so damage reduced by 2
      expect(monster.stats!.hp).toBe(9); // 10 - (3 - 2)
    });
    it("should call checkMonsterDefeat after damage", async () => {
      const gameState = createMockGameState();
      const player = createMockPlayer("player1", [spellElement.Fire]);
      const playerPos: Position = { x: 0, y: 0 };
      const monster = {
        id: "monster1",
        stats: {
          hp: 2,
          maxHp: 10,
        },
      } as Monster;
      const monsterPos: Position = { x: 1, y: 1 };
      gameState.entityPositions.set("player1", playerPos);
      gameState.positionEntities.set("0,0", player.id);
      gameState.entityPositions.set("monster1", monsterPos);
      gameState.positionEntities.set("1,1", monster.id);
      gameState.monsters.set("monster1", monster);
      const { checkMonsterDefeat } = require("./death");

      await castSpell(gameState, player, "damage-spell-1", monsterPos, mockIo);
      expect(checkMonsterDefeat).toHaveBeenCalledWith(gameState, monster);
    });
  });
  describe("Helper Functions", () => {
    it("getSpell should return spell by id", () => {
      const spell = getSpell("heal-spell-1");
      expect(spell).toBeDefined();
      expect(spell!.id).toBe("heal-spell-1");
      expect(spell!.name).toBe("Heal");
    });

    it("getSpell should return undefined for invalid id", () => {
      const spell = getSpell("invalid-id");
      expect(spell).toBeUndefined();
    });

    it("getSpellSchool should return correct spell element", () => {
      const spell = getSpell("heal-spell-1");
      const school = getSpellSchool(spell!);
      expect(school).toBe(spellElement.Earth);
    });
  });
});
