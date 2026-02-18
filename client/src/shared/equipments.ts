import equipmentsData from "./game_cards/equipments.json";
import { Card, CardType } from "../components/Card/Card";
import { EquipmentAsJson } from "../POO/interfaces/ClassAsJson/Equipment/EquipmentAsJson";

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
  range: "melee" | "ranged" | "throwable" | "long_melee" | "none";
  equipments_preventing_use: string[];
}

const equipments: Equipment[] = equipmentsData as Equipment[];

/**
 * Get an equipment by its id
 */
export function getEquipmentById(id: string): Equipment | undefined {
  return equipments.find((eq) => eq.id === id);
}

export function getAllEquipmentsAsCards(): Card[] {
  return equipments.map((eq) => ({
    id: eq.id,
    name: eq.name,
    type: CardType.Item,
    image_path: eq.image_path,
    back_image_path: "path/to/back/image", // You can set this to the correct path if needed
  }));
}

/**
 * Get the French name of an equipment by its id
 */
export function getEquipmentName(id: string): string {
  const equipment = getEquipmentById(id);
  return equipment?.name ?? id;
}

export function flattenEquipment(equipment: EquipmentAsJson): string[] {
  const equipmentIds: string[] = [];
  equipmentIds.push(...equipment.armors.map((armor) => armor.id));
  equipmentIds.push(...equipment.weapons.map((weapon) => weapon.id));
  equipmentIds.push(...equipment.potions.map((potion) => potion.id));
  return equipmentIds;
}
