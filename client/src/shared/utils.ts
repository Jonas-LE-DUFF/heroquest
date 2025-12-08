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

import {
  heroClassFr,
  monsterClassFr,
  spellElementFr,
} from "./languages/frenchEnums";

function isPlayer(u: Monster | Player): u is Player {
  return !u.id.match(/^idMonster/);
}

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

function getIconClassPath(entityType: Player | Monster): string {
  if (entityType.class === undefined) {
    return "unknown";
  }
  if (isPlayer(entityType)) {
    return getHeroClassIconPath(entityType.class);
  } else {
    return getMonsterIconPath(entityType.class);
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
    case monsterClass.Gargoyle:
      return iconGargoyle;
    case monsterClass.Goblin:
      return iconGobelin;
    case monsterClass.TerrorWarrior:
      return iconDreadWarrior;
    case monsterClass.Skeleton:
      return iconSkeleton;
    case monsterClass.Zombie:
      return iconZombie;
    case monsterClass.Orc:
      return iconOrc;
    case monsterClass.Mummy:
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

function getElementName(element: spellElement, language: string = "en") {
  switch (language) {
    case "fr":
      return spellElementFr[element];
    case "en":
      return spellElement[element];
    default:
      return spellElement[element];
  }
}

function getUnitClassName(unit: Player | Monster) {
  if (unit.class === undefined) {
    return "Inconnu";
  }
  if (isPlayer(unit)) {
    return getHeroClassName(unit.class);
  } else {
    return getMonsterClassName(unit.class);
  }
}

function getHeroClassName(classHero: heroClass) {
  return heroClassFr[classHero];
}

function getMonsterClassName(classMonster: monsterClass) {
  return monsterClassFr[classMonster];
}

function getPlayerName(game: GameState, playerId: string) {
  const player = game.players.get(playerId);
  if (!player || !player.stats) return "Inconnu";
  return player.stats.name;
}

const positionKey = (pos: Position) => `${pos.x},${pos.y}`;

export {
  isPlayer,
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
  getPlayerName,
  positionKey,
};
