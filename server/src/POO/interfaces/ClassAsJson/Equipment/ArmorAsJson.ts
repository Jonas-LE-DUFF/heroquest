import { ArmorType } from "../../../enums/ArmorType";
import { ItemAsJson } from "./ItemAsJson";

interface ArmorAsJson extends ItemAsJson {
  defense: number;
  movementPenalty: number;
  armorType: ArmorType;
}

export type { ArmorAsJson };
