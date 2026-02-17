import { ItemAsJson } from "./interfaces/ClassAsJson/Equipment/ItemAsJson";
import equipmentsData from "../shared/game_cards/equipments.json";
import { ArmorAsJson } from "./interfaces/ClassAsJson/Equipment/ArmorAsJson";
import { WeaponAsJson } from "./interfaces/ClassAsJson/Equipment/WeaponAsJson";
import { PotionAsJson } from "./interfaces/ClassAsJson/Equipment/PotionAsJson";
import { WeaponRange } from "./enums/WeaponRange";

export interface EquipmentModifiers {
  nbAttackDice?: number;
  nbDefenseDice?: number;
  movements?: number;
}

export interface Equipment {
  id: string;
  name: string;
  image_path: string;
  cost: number;
  amountOfCopies: number;
  type: "Weapon" | "Armor" | "Consumable";
  unique_usage: boolean;
  cleric_bearable: boolean;
  modifiers: EquipmentModifiers;
  range: WeaponRange | "none";
  equipments_preventing_use: string[];
}

const equipments: Equipment[] = equipmentsData as Equipment[];

abstract class Item {
  id: string;
  name: string;
  type: string;
  cost: number;

  constructor(id: string, name: string, type: string, cost: number) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.cost = cost;
  }

  abstract buildItemFromJson(json: ItemAsJson): Item;

  static buildItemFromId(json: Equipment): Item {
    switch (json.type) {
      case "Armor":
        return new Armor(
          json.id,
          json.name,
          json.type,
          json.cost,
          json?.modifiers?.nbDefenseDice || 0,
          json?.modifiers?.movements || 0,
        );
      case "Weapon":
        return new Weapon(
          json.id,
          json.name,
          json.type,
          json.cost,
          json?.modifiers?.nbAttackDice || 0,
          json?.range,
        );
      case "Consumable":
        return new Potion(json.id, json.name, json.type, json.cost);
      default:
        throw new Error(`Unknown item type: ${json.type}`);
    }
  }
}
export { Item };

class Armor extends Item {
  defense: number;
  movementPenalty: number;
  constructor(
    id: string,
    name: string,
    type: string,
    cost: number,
    defense: number,
    movementPenalty: number,
  ) {
    super(id, name, type, cost);
    this.defense = defense;
    this.movementPenalty = movementPenalty;
  }

  buildItemFromJson(json: ArmorAsJson): Armor {
    return new Armor(
      json.id,
      json.name,
      json.type,
      json.cost,
      json.defense,
      json.movementPenalty,
    );
  }
}

class Weapon extends Item {
  damage: number;
  range: WeaponRange | "none";
  constructor(
    id: string,
    name: string,
    type: string,
    cost: number,
    damage: number,
    range: WeaponRange | "none",
  ) {
    super(id, name, type, cost);
    this.damage = damage;
    this.range = range;
  }

  buildItemFromJson(json: WeaponAsJson): Weapon {
    return new Weapon(
      json.id,
      json.name,
      json.type,
      json.cost,
      json.damage,
      json.range,
    );
  }
}

class Potion extends Item {
  constructor(id: string, name: string, type: string, cost: number) {
    super(id, name, type, cost);
  }

  buildItemFromJson(json: PotionAsJson): Potion {
    return new Potion(json.id, json.name, json.type, json.cost);
  }
}

export { Armor, Weapon, Potion };
