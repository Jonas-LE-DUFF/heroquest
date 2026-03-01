import { WeaponRange } from "../../../enums/WeaponRange";
import { ItemAsJson } from "./ItemAsJson";

interface WeaponAsJson extends ItemAsJson {
  damage: number;
  range: WeaponRange;
}

export type { WeaponAsJson };
