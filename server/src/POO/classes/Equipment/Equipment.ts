import { Armor } from "./Armor";
import { Potion } from "./Potions/Potions";
import { Weapon } from "./Weapon";

import equipmentJson from "../../../shared/game_cards/equipments.json";
import { EquipmentAsJson } from "../../interfaces/ClassAsJson/Equipment/EquipmentAsJson";
import { WeaponRange } from "../../enums/WeaponRange";
import { ArmorType } from "../../enums/ArmorType";
import { Tool } from "./Tool";

class Equipment {
  gold: number;
  weapons: Weapon[] = [];
  selectedWeaponIndex: number = 0;

  armors: Armor[] = [];
  potions: Potion[] = [];
  tools: Tool[] = [];

  constructor(gold: number) {
    this.gold = gold;
  }

  get selectedWeapon(): Weapon | null {
    return this.weapons[this.selectedWeaponIndex] || null;
  }

  getDamageOfSelectedWeapon(): number {
    const weapon = this.selectedWeapon;
    if (!weapon) {
      throw new Error("No weapon selected");
    }
    return weapon.damage;
  }

  setSelectedWeaponIndex(index: number) {
    if (index < 0 || index >= this.weapons.length) {
      throw new Error("Invalid weapon index");
    }
    this.selectedWeaponIndex = index;
  }

  getDefenseTotalValue(): number {
    return this.armors.reduce((total, armor) => total + armor.defenseValue, 0);
  }

  getMovementDebuff(): number {
    return this.armors.reduce(
      (total, armor) => total + armor.armorMovementDebuff,
      0,
    );
  }

  addWeapon(weapon: Weapon) {
    this.weapons.push(weapon);
  }

  addArmor(armor: Armor) {
    if (
      armor.armorType === ArmorType.CHEST_PIECE &&
      this.armors.find((a) => a.armorType === ArmorType.CHEST_PIECE)
    ) {
      throw new Error("Only one chest piece can be equipped at a time.");
    }
    this.armors.push(armor);
  }

  addPotion(potion: Potion) {
    this.potions.push(potion);
  }

  addTool(tool: Tool) {
    this.tools.push(tool);
  }

  addEquipmentById(equipmentId: string) {
    const equipmentData = equipmentJson.find((e) => e.id === equipmentId);
    if (!equipmentData) {
      throw new Error(`Equipment with id ${equipmentId} not found.`);
    }

    switch (equipmentData.type) {
      case "Weapon":
        const weapon = new Weapon(
          equipmentData.id,
          equipmentData.name,
          equipmentData.cost,
          equipmentData.image_path,
          equipmentData.modifiers.damage || 0,
          (equipmentData.range || "melee") as WeaponRange,
        );
        this.addWeapon(weapon);
        return weapon;
      case "Armor":
        const armor = new Armor(
          equipmentData.id,
          equipmentData.name,
          equipmentData.cost,
          equipmentData.image_path,
          equipmentData.modifiers.defense || 0,
          equipmentData.modifiers.movementDebuff || 0,
          equipmentData.type as ArmorType,
        );
        this.addArmor(armor);
        return armor;
      case "Potion":
        throw new Error("Potion creation not implemented yet.");
      case "Tool":
        const tool = new Tool(
          equipmentData.id,
          equipmentData.name,
          equipmentData.cost,
          equipmentData.image_path,
        );
        this.addTool(tool);
        return tool;
    }
  }

  toJson(): EquipmentAsJson {
    return {
      gold: this.gold,
      selectedWeaponIndex: this.selectedWeaponIndex,
      weapons: this.weapons.map((weapon) => weapon.toJson()),
      armors: this.armors.map((armor) => armor.toJson()),
      potions: this.potions.map((potion) => potion.toJson()),
      tools: this.tools.map((tool) => tool.toJson()),
    };
  }
}

export { Equipment };
