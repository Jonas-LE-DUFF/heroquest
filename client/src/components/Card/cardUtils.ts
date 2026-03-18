import equipments from "../../shared/game_cards/equipments.json";
import treasures from "../../shared/game_cards/treasure.json";
import spells from "../../shared/game_cards/spells.json";
import spellELements from "../../shared/game_cards/spell_elements_back.json";
import { getElementName } from "../../shared/utils";
import { SpellElement } from "../../POO/enums/SpellElement";
import {
  CardAsJson,
  CardType,
} from "../../POO/interfaces/ClassAsJson/CardAsJson";

type Card = {
  id: string;
  image_path?: string;
  [k: string]: any;
};

export function getSpellEllementAsCard(element: SpellElement): CardAsJson {
  const elementName = SpellElement[element];
  return {
    id: elementName,
    name: getElementName(element, "en"),
    imgPath: getBackImagePath("spell_element", elementName) || "",
    backImgPath: getBackImagePath("spell_element", elementName) || "",
    type: CardType.Back,
  };
}

export function getSpellAsCard(spellId: string): CardAsJson {
  const spell = spells.deck.find((s) => s.id === spellId);
  if (!spell) {
    console.error(`Spell with id ${spellId} not found`);
    throw new Error(`Spell with id ${spellId} not found`);
  }
  return {
    id: spell.id,
    name: spell.name,
    imgPath: getCardImagePath(spell.id, "spell") || "",
    backImgPath: getBackImagePath("spell_element", spell.school) || "",
    type: CardType.Spell,
  };
}

export function getItemAsCard(id: string): CardAsJson {
  const item = equipments.deck.find((eq) => eq.id === id);
  const treasure = treasures.deck.find((t) => t.id === id);
  const cardItem = item || treasure;
  if (!cardItem) {
    console.error(`Item with id ${id} not found`);
    throw new Error(`Item with id ${id} not found`);
  }
  
  const card =  {
    id: cardItem.id,
    name: cardItem.name,
    imgPath:
      getCardImagePath(cardItem.id, item ? "equipment" : "treasure") || "",
    backImgPath:
      getBackImagePath(item ? "equipment" : "treasure") || "",
    type: CardType.Item,
  };
  console.log("Generated card:", card);
  return card;
}

function getSpellListForSchool(spellSchool: SpellElement): string[] {
  // This is a placeholder implementation.
  // Replace with actual logic to get spell IDs for the given school.

  const spellList: string[] = [];
  for (let i = 0; i < spells.deck.length; i++) {
    const spell = spells.deck[i];
    if (spell.school === getElementName(spellSchool, "en")) {
      spellList.push(spell.id);
    }
  }

  return spellList;
}

export function getDjinnSpells(): string[] {
  const djinnSpells: string[] = [];
  const jsonFile = spells.deck as Card[];
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

function getBackImagePath(
  cardType: string,
  elementName?: string | undefined,
): string | undefined {
  let jsonFile;

  switch (cardType) {
    case "equipment":
      jsonFile = equipments;
      break;
    case "spell":
      jsonFile = spells;
      break;
    case "treasure":
      jsonFile = treasures;
      break;
    case "spell_element":
      jsonFile = spellELements;
      if (!elementName) {
        throw new Error("Element name is required for spell element cards");
      } else {
        const element = jsonFile.find((e) => e.id === elementName);
        return element ? element.image_path : undefined;
      }
    default:
      return undefined;
  }

  const backImgPath = (jsonFile as any).backImg;
  console.log("Back image path:", backImgPath);
  return backImgPath;
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
    case "treasure":
      jsonFile = treasures;
      break;
    default:
      return undefined;
  }

  const eq = (jsonFile.deck as Card[]).find((e) => e.id === id);
  const image_path = eq?.image_path;
  return image_path;
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
  const eq = (jsonFile.deck as Card[]).find((e) => e.id === id);
  return eq ? eq.name : undefined;
}

export { getSpellListForSchool, getCardImagePath, getCardName };
