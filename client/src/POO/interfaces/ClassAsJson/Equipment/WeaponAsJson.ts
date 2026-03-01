import { WeaponRange } from "../../../enums/WeaponRange";
import { ItemAsJson } from "./ItemAsJson";

interface WeaponAsJson extends ItemAsJson {
  damage: number;
  range: WeaponRange | "none";
}

export type { WeaponAsJson };
