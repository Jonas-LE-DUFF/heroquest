import { ArmorAsJson } from "./ArmorAsJson";
import { PotionAsJson } from "./PotionAsJson";
import { WeaponAsJson } from "./WeaponAsJson";

interface EquipmentAsJson {
  gold: number;
  selectedWeaponIndex: number;
  weapons: WeaponAsJson[];
  armors: ArmorAsJson[];
  potions: PotionAsJson[];
}

export type { EquipmentAsJson };
