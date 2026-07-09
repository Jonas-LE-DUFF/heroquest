import { FightDiceFaces } from "../../POO/enums/Dices/FightDiceFaces";
import { PlayerRole } from "../../POO/enums/PlayerRole";

import diceDeathHead from "/assets/dice/fightDiceFaces/death.png";
import diceMonsterShield from "/assets/dice/fightDiceFaces/blackShield.png";
import diceHeroShield from "/assets/dice/fightDiceFaces/whiteShield.png";

import redDice1 from "/assets/dice/redDiceFaces/redDice1.png";
import redDice2 from "/assets/dice/redDiceFaces/redDice2.png";
import redDice3 from "/assets/dice/redDiceFaces/redDice3.png";
import redDice4 from "/assets/dice/redDiceFaces/redDice4.png";
import redDice5 from "/assets/dice/redDiceFaces/redDice5.png";
import redDice6 from "/assets/dice/redDiceFaces/redDice6.png";

export type DiceKind = "red" | "fight";

export type RedRollData = {
  listResults: number[];
  role: PlayerRole;
  vector: { x: number; y: number; z: number; boost: number };
};

export type FightRollData = {
  listResults: FightDiceFaces[];
  role: PlayerRole;
  vector: { x: number; y: number; z: number; boost: number };
};

export type RollDataByKind = {
  red: RedRollData;
  fight: FightRollData;
};

function getDiceLabels(kind: DiceKind): string[] {
  switch (kind) {
    case "red":
      return [" ", redDice1, redDice2, redDice3, redDice4, redDice5, redDice6];
    case "fight":
      return [
        " ",
        diceDeathHead,
        diceDeathHead,
        diceDeathHead,
        diceHeroShield,
        diceHeroShield,
        diceMonsterShield,
      ];
    default:
      return [];
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

function getRedDiceFace(face: number) {
  switch (face) {
    case 1:
      return redDice1;
    case 2:
      return redDice2;
    case 3:
      return redDice3;
    case 4:
      return redDice4;
    case 5:
      return redDice5;
    case 6:
      return redDice6;
    default:
      return "dice"; // or a default icon
  }
}

function getDiceFaceImage(
  face: number | FightDiceFaces,
  diceKind: DiceKind,
): string {
  if (diceKind === "red") {
    return getRedDiceFace(face);
  }
  if (diceKind === "fight") {
    return getFightDiceFace(face as FightDiceFaces);
  }
  return "";
}

export {
  getDiceLabels,
  getDiceFaceImage,
  getFightDiceFace,
  getFightDiceFaceNumber,
  getRedDiceFace,
};
