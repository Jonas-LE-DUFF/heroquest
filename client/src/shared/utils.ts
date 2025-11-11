import {
  diceFace,
  GameState,
  heroClass,
  Monster,
  monsterClass,
  Player,
  Position,
  SendableGameState,
  spellElement,
} from "./type";
import iconBarbarian from "./../components/images/icons/hero/barbarian.png";
import iconCleric from "./../components/images/icons/hero/wizard.png";
import iconDwarf from "./../components/images/icons/hero/dwarf.png";
import iconElf from "./../components/images/icons/hero/elf.png";
import iconGobelin from "./../components/images/icons/monster/goblin.png";
import iconSkeleton from "./../components/images/icons/monster/skeleton.png";
import iconZombie from "./../components/images/icons/monster/zombie.png";
import iconOrc from "./../components/images/icons/monster/orc.png";
import iconAbomination from "./../components/images/icons/monster/abomination.png";
import iconMummy from "./../components/images/icons/monster/mummy.png";
import iconDreadWarrior from "./../components/images/icons/monster/dreadwarrior.png";
import iconGargoyle from "./../components/images/icons/monster/gargoyle.png";
import diceDeathHead from "./../components/images/dices/battleDices/death.png";
import diceMonsterShield from "./../components/images/dices/battleDices/blackShield.png";
import diceHeroShield from "./../components/images/dices/battleDices/whiteShield.png";

import { heroClassFr, monsterClassFr, spellElementFr } from "./frenchEnums";

function convertSendableGameStateAsGameState(
  game: SendableGameState
): GameState {
  const players: Map<string, Player> = new Map<string, Player>();
  const monsters: Map<string, Monster> = new Map<string, Monster>();
  const entityPositions: Map<string, Position> = new Map<string, Position>();
  const positionEntities: Map<string, string> = new Map<string, string>();

  game.players.forEach((player: Player) => {
    players.set(player.id, player);
  });

  game.monsters.forEach((monster: Monster) => {
    monsters.set(monster.id, monster);
  });

  if (game.ids && game.positions) {
    game.ids.forEach((id, index) => {
      const position = game.positions[index];
      if (id && position) {
        entityPositions.set(id, position);
        positionEntities.set(positionKey(position), id);
      }
    });
  }

  return {
    id: game.id,
    board: game.board,
    players: players,
    monsters: monsters,
    entityPositions: entityPositions,
    positionEntities: positionEntities,
    turnOrder: game.turnOrder,
    currentTurn: game.currentTurn,
    status: game.status,
    walls: game.walls,
    doors: game.doors,
  };
}

function everyOneReady(game: GameState) {
  const players = game.players.values();
  for (let player of players) {
    if (!player.ready) return false;
  }
  return true;
}

function getIconClassPath(entityType: heroClass | monsterClass): string {
  if (Object.values(heroClass).includes(entityType as heroClass)) {
    return getHeroClassIconPath(entityType as heroClass);
  } else if (Object.values(monsterClass).includes(entityType as monsterClass)) {
    return getMonsterIconPath(entityType as monsterClass);
  } else {
    return "unknown"; // or a default icon
  }
}

function getHeroClassIconPath(heroType: heroClass): string {
  switch (heroType) {
    case heroClass.Barbarian:
      return iconBarbarian;
    case heroClass.Cleric:
      return iconCleric;
    case heroClass.Dwarf:
      return iconDwarf;
    case heroClass.Elf:
      return iconElf;
    default:
      return "hero"; // or a default icon
  }
}

function getMonsterIconPath(monsterType: monsterClass): string {
  switch (monsterType) {
    case monsterClass.Abomination:
      return iconAbomination;
    case monsterClass.Gargouille:
      return iconGargoyle;
    case monsterClass.Goblin:
      return iconGobelin;
    case monsterClass.Guerrier_de_la_terreur:
      return iconDreadWarrior;
    case monsterClass.Squelette:
      return iconSkeleton;
    case monsterClass.Zombie:
      return iconZombie;
    case monsterClass.Orc:
      return iconOrc;
    case monsterClass.Momie:
      return iconMummy;
    default:
      return "monster"; // or a default icon
  }
}

function getFightDiceFace(face: diceFace) {
  switch (face) {
    case diceFace.Hit:
      return diceDeathHead;
    case diceFace.BlackShield:
      return diceMonsterShield;
    case diceFace.WhiteShield:
      return diceHeroShield;
    default:
      return "dice"; // or a default icon
  }
}

function getFightDiceFaceNumber(face: number) {
  face = face % 3;
  switch (face) {
    case 0:
      return diceDeathHead;
    case 1:
      return diceMonsterShield;
    case 2:
      return diceHeroShield;
    default:
      return "dice"; // or a default icon
  }
}

function getElementName(element: spellElement) {
  return spellElementFr[element];
}

function getUnitClassName(unit: heroClass | monsterClass) {
    if (Object.values(heroClass).includes(unit as heroClass)) {
        return getHeroClassName(unit as heroClass);
    } else if (Object.values(monsterClass).includes(unit as monsterClass)) {
        return getMonsterClassName(unit as monsterClass);
    } else {
        return "unknown"; // or a default class name
    }
}

function getHeroClassName(classHero: heroClass) {
  return heroClassFr[classHero];
}

function getMonsterClassName(classMonster: monsterClass) {
  return monsterClassFr[classMonster];
}

const positionKey = (pos: Position) => `${pos.x},${pos.y}`;

export {
  convertSendableGameStateAsGameState,
  everyOneReady,
  getIconClassPath,
  getHeroClassIconPath,
  getMonsterIconPath,
  getFightDiceFace,
  getFightDiceFaceNumber,
  getUnitClassName,
  getElementName,
  getHeroClassName,
  getMonsterClassName,
  positionKey,
};
