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
import { GameAsJson } from "../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { MonsterAsJson } from "../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";
import { HeroAsJson } from "../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";
import { MonsterCategory } from "../POO/enums/Categories/MonsterCategory";
import { FightDiceFaces } from "../POO/enums/Dices/FightDiceFaces";
import { SpellElement } from "../POO/enums/SpellElement";

function isHero(entity: HeroAsJson | MonsterAsJson): entity is HeroAsJson {
  return (entity as HeroAsJson).controlledByPlayerId !== undefined;
}

function everyOneReady(game: GameAsJson) {
  const players = game.players.values();
  for (let player of players) {
    if (!player.isReady) return false;
  }
  return true;
}

function getIconClassPath(entityType: HeroAsJson | MonsterAsJson): string {
  if (entityType.category === undefined) {
    return "unknown";
  }
  if (isHero(entityType)) {
    return getHeroClassIconPath(entityType.category);
  } else {
    return getMonsterIconPath(entityType.category);
  }
}

function getHeroClassIconPath(heroType: HeroCategory): string {
  switch (heroType) {
    case HeroCategory.Barbarian:
      return iconBarbarian;
    case HeroCategory.Cleric:
      return iconCleric;
    case HeroCategory.Dwarf:
      return iconDwarf;
    case HeroCategory.Elf:
      return iconElf;
    default:
      return "unknown hero class"; // or a default icon
  }
}

function getMonsterIconPath(monsterType: MonsterCategory): string {
  switch (monsterType) {
    case MonsterCategory.Abomination:
      return iconAbomination;
    case MonsterCategory.Gargoyle:
      return iconGargoyle;
    case MonsterCategory.Goblin:
      return iconGobelin;
    case MonsterCategory.TerrorWarrior:
      return iconDreadWarrior;
    case MonsterCategory.Skeleton:
      return iconSkeleton;
    case MonsterCategory.Zombie:
      return iconZombie;
    case MonsterCategory.Orc:
      return iconOrc;
    case MonsterCategory.Mummy:
      return iconMummy;
    default:
      return "unknown monster class"; // or a default icon
  }
}

function getFightDiceFace(face: FightDiceFaces) {
  switch (face) {
    case FightDiceFaces.Hit:
      return diceDeathHead;
    case FightDiceFaces.BlackShield:
      return diceMonsterShield;
    case FightDiceFaces.WhiteShield:
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

function getElementName(element: SpellElement, language: string = "en") {
  switch (language) {
    case "fr":
      return spellElementFr[element];
    case "en":
      return spellElementFr[element];
    default:
      return spellElementFr[element];
  }
}

function getUnitClassName(unit: HeroAsJson | MonsterAsJson) {
  if (unit.category === undefined) {
    return "Inconnu";
  }
  if (isHero(unit)) {
    return getHeroClassName(unit.category);
  } else {
    return getMonsterClassName(unit.category);
  }
}

function getHeroClassName(classHero: HeroCategory) {
  return heroClassFr[classHero];
}

function getMonsterClassName(classMonster: MonsterCategory) {
  return monsterClassFr[classMonster];
}

function getPlayerName(game: GameAsJson, playerId: string) {
  const player = game.players.find((p) => p.id === playerId);
  if (!player) return "Inconnu";
  return player.name;
}

export {
  isHero,
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
};
