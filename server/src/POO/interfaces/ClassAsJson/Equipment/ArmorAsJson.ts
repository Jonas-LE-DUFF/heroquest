import { ItemAsJson } from "./ItemAsJson";

interface ArmorAsJson extends ItemAsJson {
  defense: number;
  movementPenalty: number;
}

export type { ArmorAsJson };
