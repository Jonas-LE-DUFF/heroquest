import equipments from "../../shared/game_cards/equipments.json";
import treasures from "../../shared/game_cards/treasure.json";
import spells from "../../shared/game_cards/spells.json";
import back from "../../shared/game_cards/backCard.json";
import { getElementName } from "../../shared/utils";
import { SpellElement } from "../../POO/enums/SpellElement";
import { Card as Card2, CardType } from "./Card";

type Card = {
  id: string;
  image_path?: string;
  [k: string]: any;
};

export function getSpellEllementAsCard(element: SpellElement): Card2 {
  const elementName = SpellElement[element];
  return {
    id: elementName,
    name: getElementName(element, "en"),
    image_path: getCardImagePath(elementName, "back") || "",
    back_image_path: getCardImagePath(elementName, "back") || "",
    type: CardType.Back,
  };
}

export function getSpellAsCard(spellId: string): Card2 {
  const spell = spells.find((s) => s.id === spellId);
  if (!spell) {
    console.error(`Spell with id ${spellId} not found`);
    throw new Error(`Spell with id ${spellId} not found`);
  }
  return {
    id: spell.id,
    name: spell.name,
    image_path: getCardImagePath(spell.id, "spell") || "",
    back_image_path: getCardImagePath(spell.id, "spell") || "",
    type: CardType.Spell,
  };
}

export function getItemAsCard(id: string): Card2 {
  const item = equipments.find((eq) => eq.id === id);
  const treasure = treasures.deck.find((t) => t.id === id);
  const cardItem = item || treasure;
  if (!cardItem) {
    console.error(`Item with id ${id} not found`);
    throw new Error(`Item with id ${id} not found`);
  }
  return {
    id: cardItem.id,
    name: cardItem.name,
    image_path: getCardImagePath(cardItem.id, "equipment") || "",
    back_image_path: getCardImagePath(cardItem.id, "equipment") || "",
    type: CardType.Item,
  };
}

function getSpellListForSchool(spellSchool: SpellElement): string[] {
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

export function getDjinnSpells(): string[] {
  const djinnSpells: string[] = [];
  const jsonFile = spells as Card[];
  const djinnSpell = jsonFile.find((e) => e.id === "Djinn");
  if (djinnSpell) {
    for (const spell of djinnSpell.sub_spells) {
      djinnSpells.push(spell.id);
    }
    return djinnSpells;
  }
  console.error("No Djinn spell found");
  return [];
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
  const ret = `${import.meta.env.BASE_URL}${image_path}`;
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

export { getSpellListForSchool, getCardImagePath, getCardName };
