import { ArmorAsJson } from "./ArmorAsJson";
import { ItemAsJson } from "./ItemAsJson";
import { PotionAsJson } from "./PotionAsJson";
import { WeaponAsJson } from "./WeaponAsJson";

interface EquipmentAsJson {
  gold: number;
  selectedWeaponIndex: number;
  weapons: WeaponAsJson[];
  armors: ArmorAsJson[];
  potions: PotionAsJson[];
  tools: ItemAsJson[];
}

export type { EquipmentAsJson };
