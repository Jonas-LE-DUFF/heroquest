import equipments from "../../shared/equipments.json";

type Equipment = {
  id: string;
  image_path?: string;
  [k: string]: any;
};

function getAllEquipmentCardNames(): string[] {
  return (equipments as Equipment[]).map((e) => e.id);
}

function getCardImagePath(id: string, cardType: string): string | undefined {
  let jsonFile;
  switch (cardType) {
    case "equipment":
      jsonFile = equipments;
      break;
    default:
      return undefined;
  }

  const eq = (jsonFile as Equipment[]).find((e) => e.id === id);
  console.log("Equipment found:", eq);
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
  const eq = (jsonFile as Equipment[]).find((e) => e.id === id);
  return eq ? eq.name : undefined;
}

export { getCardImagePath, getAllEquipmentCardNames, getCardName };
