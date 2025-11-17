import equipments from "../../shared/game_cards/equipments.json";
import spells from "../../shared/game_cards/spells.json";
import back from "../../shared/game_cards/backCard.json";

type Card = {
  id: string;
  image_path?: string;
  [k: string]: any;
};

function getAllEquipmentCardNames(): string[] {
  return (equipments as Card[]).map((e) => e.id);
}

function getCardImagePath(id: string, cardType: string): string | undefined {
  let jsonFile;
  console.log(id, cardType);

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
  console.log("json found:", eq);
  console.log(eq?.image_path);
  const image_path = eq?.image_path;
  const ret = `${process.env.PUBLIC_URL}/${image_path}`;
  console.log(ret);

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

export { getCardImagePath, getAllEquipmentCardNames, getCardName };
