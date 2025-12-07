import equipments from "../../shared/game_cards/equipments.json";
import spells from "../../shared/game_cards/spells.json";
import back from "../../shared/game_cards/backCard.json";
import { spellElement } from "../../shared/type";
import { getElementName } from "../../shared/utils";

type Card = {
  id: string;
  image_path?: string;
  [k: string]: any;
};

function getAllEquipmentCardNames(): string[] {
  return (equipments as Card[]).map((e) => e.id);
}

function getSpellListForSchool(spellSchool: spellElement): string[] {
  // This is a placeholder implementation.
  // Replace with actual logic to get spell IDs for the given school.

  const spellList: string[] = [];
  for (let i = 0; i < spells.length; i++) {
    const spell = spells[i];
    if (spell.school === getElementName(spellSchool, "en")) {
      spellList.push(spell.id);
    }
  }

  return spellList;
}

function getCardImagePath(id: string, cardType: string): string | undefined {
  let jsonFile;

  switch (cardType) {
    case "equipment":
      jsonFile = equipments;
      break;
    case "spell":
      jsonFile = spells;
      break;
    case "back":
      jsonFile = back;
      break;
    default:
      return undefined;
  }

  const eq = (jsonFile as Card[]).find((e) => e.id === id);
  const image_path = eq?.image_path;
  const ret = `${process.env.PUBLIC_URL}/${image_path}`;
  return ret;
}

function getCardName(id: string, cardType: string): string | undefined {
  let jsonFile;
  switch (cardType) {
    case "equipment":
      jsonFile = equipments;
      break;
    default:
      return undefined;
  }
  const eq = (jsonFile as Card[]).find((e) => e.id === id);
  return eq ? eq.name : undefined;
}

export {
  getSpellListForSchool,
  getCardImagePath,
  getAllEquipmentCardNames,
  getCardName,
};
