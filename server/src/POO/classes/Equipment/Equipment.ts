import { Armor } from "./Items/Armor";
import {
  Potion,
  EquipmentPotionFactory,
  TreasurePotionFactory,
  PotionFactory,
  ArtifactPotionFactory,
} from "./Items/Potions";
import { Weapon } from "./Items/Weapon";

import equipmentJson from "../../../shared/game_cards/equipments.json";
import treasuresJson from "../../../shared/game_cards/treasure.json";
import artifactsJson from "../../../shared/game_cards/artifacts.json";
import { EquipmentAsJson } from "../../interfaces/ClassAsJson/Equipment/EquipmentAsJson";
import { WeaponRange } from "../../enums/WeaponRange";
import { ArmorType } from "../../enums/ArmorType";
import { Tool } from "./Items/Tool";
import { CarryOptions, Item } from "./Items/Item";

interface ItemData {
  id: string;
  name: string;
  image_path: string;
  type: "Weapon" | "Armor" | "Potion" | "Tool" | "Artifact" | "Ring";
  cleric_bearable?: CarryOptions;
}

interface EquipmentData extends ItemData {
  cost: number;
  modifiers: {
    damage?: number;
    defense?: number;
    movementDebuff?: number;
  };
  range?: WeaponRange;
}

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

  removePotion(potionId: string) {
    this.potions = this.potions.filter((p) => p.id !== potionId);
  }

  addTool(tool: Tool) {
    this.tools.push(tool);
  }

  hasEquipment(equipmentId: string): boolean {
    return this.mergeEquipment().some((item) => item.reference === equipmentId);
  }

  private mergeEquipment(): Item[] {
    return (
      [
        ...this.weapons,
        ...this.armors,
        ...this.potions,
        ...this.tools,
      ] as Item[]
    ).sort((a, b) => a.name.localeCompare(b.name));
  }

  removeClericUncarryableEquipment() {
    this.armors = this.armors.filter((armor) => armor.canClericCarry);
    this.weapons = this.weapons.filter((weapon) => weapon.canClericCarry);
  }

  addEquipmentById(equipmentId: string) {
    let equipmentData: EquipmentData | undefined = equipmentJson.deck.find(
      (e) => e.id === equipmentId,
    ) as EquipmentData;
    const treasureData = treasuresJson.deck.find((t) => t.id === equipmentId);
    let artifactData = artifactsJson.deck.find((a) => a.id === equipmentId);
    let potionFactory: PotionFactory | undefined = new EquipmentPotionFactory();
    if (!equipmentData && !artifactData && !treasureData) {
      throw new Error(`Item with id ${equipmentId} not found.`);
    }
    if (treasureData) {
      if (!treasureData.effect.potion_gained) {
        throw new Error(
          `Treasure with id ${equipmentId} does not grant a potion.`,
        );
      }
      potionFactory = new TreasurePotionFactory();
      equipmentData = {
        id: treasureData.id,
        name: treasureData.name,
        cost: 0,
        image_path: treasureData.image_path,
        type: "Potion",
        modifiers: {},
      };
    }
    if (artifactData) {
      equipmentData = { ...artifactData, cost: 0 } as EquipmentData;
      potionFactory = new ArtifactPotionFactory();
    }
    this.addEquipment(equipmentData, potionFactory);
  }

  private addEquipment(
    equipmentData: EquipmentData,
    potionFactory: PotionFactory,
  ) {
    switch (equipmentData.type) {
      case "Weapon": {
        const weapon = new Weapon(
          equipmentData.id,
          equipmentData.name,
          equipmentData.cost,
          equipmentData.image_path,
          equipmentData.cleric_bearable ?? "true",
          equipmentData.modifiers.damage || 0,
          (equipmentData.range || "melee") as WeaponRange,
        );
        this.addWeapon(weapon);
        return weapon;
      }
      case "Armor": {
        const armor = new Armor(
          equipmentData.id,
          equipmentData.name,
          equipmentData.cost,
          equipmentData.image_path,
          equipmentData.cleric_bearable ?? "true",
          equipmentData.modifiers.defense || 0,
          equipmentData.modifiers.movementDebuff || 0,
          equipmentData.type as ArmorType,
        );
        this.addArmor(armor);
        return armor;
      }
      case "Potion": {
        const potion: Potion = potionFactory.createPotionFromReference(
          equipmentData.id,
        );
        this.addPotion(potion);
        return potion;
      }
      case "Tool": {
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
