import equipments from "../../shared/game_cards/equipments.json";
import treasures from "../../shared/game_cards/treasure.json";
import artifacts from "../../shared/game_cards/artifacts.json";
import spells from "../../shared/game_cards/spells.json";
import spellELements from "../../shared/game_cards/spell_elements_back.json";
import { getElementName } from "../../shared/utils";
import { SpellElement } from "../../POO/enums/SpellElement";
import {
  CardAsJson,
  CardType,
} from "../../POO/interfaces/ClassAsJson/CardAsJson";

type JsonFile = {
  deck: Card[];
  backImg?: string;
};

type Card = {
  id: string;
  name: string;
  image_path: string;
};

type SpellCard = Card & {
  school?: string | undefined;
  range: string;
  target_type: string;
  effect: {
    type: string;
    stat: string;
    value: null | string;
    comment: string;
    status_type?: string | undefined;
  };
  sub_spells?: { id: string }[] | undefined;
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
  const spell: SpellCard | undefined = spells.deck.find(
    (s) => s.id === spellId,
  );
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
  const artifact = artifacts.deck.find((a) => a.id === id);
  const cardItem = item || treasure || artifact;
  if (!cardItem) {
    console.error(`Item with id ${id} not found`);
    throw new Error(`Item with id ${id} not found`);
  }

  const card = {
    id: cardItem.id,
    name: cardItem.name,
    imgPath:
      getCardImagePath(
        cardItem.id,
        item ? "equipment" : treasure ? "treasure" : "artifact",
      ) || "",
    backImgPath:
      getBackImagePath(
        item ? "equipment" : treasure ? "treasure" : "artifact",
      ) || "",
    type: CardType.Item,
  };
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
  const jsonFile = spells.deck as SpellCard[];
  const djinnSpell = jsonFile.find((e) => e.id === "Djinn");
  if (djinnSpell) {
    for (const spell of djinnSpell.sub_spells || []) {
      djinnSpells.push(spell.id);
    }
    return djinnSpells;
  }
  console.error("No Djinn spell found");
  return [];
}

function getBackImagePath(
  cardType: string,
  elementName?: string,
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
    case "artifact":
      jsonFile = artifacts;
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

  const backImgPath: string = (jsonFile as JsonFile).backImg || "";
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
    case "artifact":
      jsonFile = artifacts;
      break;
    default:
      return undefined;
  }

  const eq = (jsonFile.deck as Card[]).find((e) => e.id === id);
  const image_path = eq?.image_path;
  return image_path;
}

export function getAllTreasuresItems(): CardAsJson[] {
  return treasures.deck
    .filter((treasure) => !!treasure.effect.potion_gained)
    .map((treasure) => ({
      id: treasure.id,
      name: treasure.name,
      type: CardType.Item,
      imgPath: treasure.image_path || "",
      backImgPath: treasures.backImg || "",
    }));
}

export function getAllArtifactsItems(): CardAsJson[] {
  return artifacts.deck.map((artifact) => ({
    id: artifact.id,
    name: artifact.name,
    type: CardType.Item,
    imgPath: artifact.image_path || "",
    backImgPath: artifacts.backImg || "",
  }));
}

export { getSpellListForSchool, getCardImagePath };
