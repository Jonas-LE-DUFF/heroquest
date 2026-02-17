import { ArmorAsJson } from "./interfaces/ClassAsJson/Equipment/ArmorAsJson";
import { EquipmentAsJson } from "./interfaces/ClassAsJson/Equipment/EquipmentAsJson";
import { PotionAsJson } from "./interfaces/ClassAsJson/Equipment/PotionAsJson";
import { WeaponAsJson } from "./interfaces/ClassAsJson/Equipment/WeaponAsJson";

class Equipment {
  gold: number;
  selectedWeaponIndex: number;
  weapons: WeaponAsJson[];
  armors: ArmorAsJson[];
  potions: PotionAsJson[];

  constructor(equipmentAsJson: EquipmentAsJson) {
    this.gold = equipmentAsJson.gold;
    this.selectedWeaponIndex = equipmentAsJson.selectedWeaponIndex;
    this.weapons = equipmentAsJson.weapons;
    this.armors = equipmentAsJson.armors;
    this.potions = equipmentAsJson.potions;
  }
}
export { Equipment };
