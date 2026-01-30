import { ArmorAsJson } from "./ArmorAsJson";
import { WeaponAsJson } from "./WeaponAsJson";

interface EquipmentAsJson {
    gold: number;
    selectedWeaponIndex: number;
    weapons: WeaponAsJson[];
    armors: ArmorAsJson[];
}

export type { EquipmentAsJson };