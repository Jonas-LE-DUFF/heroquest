jest.mock("../server/ServerHeroQuest", () => {
  const mockIo = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    sockets: {
      adapter: {
        rooms: new Map<string, Set<string>>(),
      },
      sockets: new Map<string, Socket>(),
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

import { Socket } from "socket.io";
import { HealSpellEffect } from "../POO/classes/Spell/HealSpellEffect";
import { Spell } from "../POO/classes/Spell/Spell";
import { SpellElement } from "../POO/enums/SpellElement";
import { ServerHeroQuest } from "../server/ServerHeroQuest";
import { dealDamage } from "../services/CombatService";
import { createTestMonster, createTestStats, setupGameWithPlayers } from "./testUtils";
import { TreasurePotionFactory } from "../POO/classes/Equipment/Items/Potions";

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

describe("playerDeath", () => {
  it("should remove the hero from the game state when health reaches 0", () => {
    const game = setupGameWithPlayers();
    game.endTurn(); // end monster turn to start hero turn
    const gameState = game.getGameState();
    const hero = game.getHeroes()[0];
    const pos = gameState.board.getPositionOfUnit(hero!.id)!;

    const server = ServerHeroQuest.getServerInstance() as unknown as {
      getGame: jest.Mock;
    };
    server.getGame.mockReturnValue(game);

    // Deal lethal damage
    dealDamage("test-game", hero!, 8);

    // unit removed from the list of units
    expect(gameState.getUnitById(hero!.id)).toBeUndefined();
    // unit removed from the board
    expect(gameState.board.getUnitAt(pos)).toBeUndefined();
    // unit removed from the play order
    expect(game.getCurrentHeroTurn().id).not.toBe(hero!.id);
  });

  it("should not remove the hero if they have a healing spell", () => {
    const game = setupGameWithPlayers();
    game.endTurn(); // end monster turn to start hero turn
    const gameState = game.getGameState();
    const hero = game.getHeroes()[0];
    const pos = gameState.board.getPositionOfUnit(hero!.id)!;

    // Give the hero a healing spell
    hero!.spells.push(new Spell("Water_heal", "Eau de Guérison", SpellElement.Water, new HealSpellEffect(4), ["hero", "self"]));

    const server = ServerHeroQuest.getServerInstance() as unknown as {
      getGame: jest.Mock;
    };
    server.getGame.mockReturnValue(game);

    dealDamage("test-game", hero!, 8);

    // unit still in the list of units
    expect(gameState.getUnitById(hero!.id)).toBeDefined();
    // unit still on the board
    expect(gameState.board.getUnitAt(pos)).toBeDefined();
    // unit still in the play order
    expect(game.getCurrentHeroTurn().id).toBe(hero!.id);
    // player should have used the healing spell
    expect(hero!.usedSpells.length).toBe(1);
    expect(hero!.usedSpells[0]!.id).toBe("Water_heal");
    // player should have 1 health point
    expect(hero!.stats.health).toBe(1);
  });

  it("should not remove the hero if they have a healing potion", () => {
    const game = setupGameWithPlayers();
    game.endTurn(); // end monster turn to start hero turn
    const gameState = game.getGameState();
    const hero = game.getHeroes()[0];
    const pos = gameState.board.getPositionOfUnit(hero!.id)!;

    // Give the hero a healing potion
    const potionFactory = new TreasurePotionFactory();
    hero!.equipment.addPotion(potionFactory.createPotionFromReference("heal_potion"));
    
    const server = ServerHeroQuest.getServerInstance() as unknown as {
      getGame: jest.Mock;
    };
    server.getGame.mockReturnValue(game);

    dealDamage("test-game", hero!, 8);

    // unit still in the list of units
    expect(gameState.getUnitById(hero!.id)).toBeDefined();
    // unit still on the board
    expect(gameState.board.getUnitAt(pos)).toBeDefined();
    // unit still in the play order
    expect(game.getCurrentHeroTurn().id).toBe(hero!.id);
    // player should have used the healing potion
    expect(hero!.equipment.potions.find(p => p.reference === "heal_potion")).toBeUndefined();
    // player should have 1 health point
    expect(hero!.stats.health).toBe(1);
  });
});
