import equipmentsData from "./game_cards/equipments.json";
import heroesData from "./game_cards/heroes.json";
import { EquipmentAsJson } from "../POO/interfaces/ClassAsJson/Equipment/EquipmentAsJson";
import { ItemAsJson } from "../POO/interfaces/ClassAsJson/Equipment/ItemAsJson";
import { CardAsJson, CardType } from "../POO/interfaces/ClassAsJson/CardAsJson";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";

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
  type: "Weapon" | "Armor" | "Potion" | "Tool";
  unique_usage: boolean;
  cleric_bearable: boolean;
  modifiers: EquipmentModifiers;
  range: "melee" | "ranged" | "throwable" | "long_melee" | "none";
  equipments_preventing_use: string[];
}

const equipments: Equipment[] = equipmentsData.deck as Equipment[];

/**
 * Get an equipment by its id
 */
export function getEquipmentById(id: string): Equipment | undefined {
  return equipments.find((eq) => eq.id === id);
}

export function getAllEquipmentsAsCards(): CardAsJson[] {
  return equipments.map((eq) => ({
    id: eq.id,
    name: eq.name,
    type: CardType.Item,
    imgPath: eq.image_path,
    backImgPath: "path/to/back/image", // You can set this to the correct path if needed
  }));
}

/**
 * Get the French name of an equipment by its id
 */
export function findEquipmentName(id: string | undefined): string | undefined {
  if (!id) {
    return undefined;
  }
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

export function getEquipmentAsCards(equipment: EquipmentAsJson): CardAsJson[] {
  const items: ItemAsJson[] = getEquipmentAsItems(equipment);
  return items.map((item) => {
    const eq = getEquipmentById(item.id);
    return {
      id: item.id,
      name: item.name,
      type: CardType.Item,
      imgPath: eq?.image_path ?? "path/to/default/image", // You can set this to the correct path if needed
      backImgPath: equipmentsData.backImg ?? "path/to/back/image", // You can set this to the correct path if needed
    };
  });
}

export function getEquipmentAsItems(equipment: EquipmentAsJson): ItemAsJson[] {
  const items: ItemAsJson[] = [];
  items.push(...equipment.armors);
  items.push(...equipment.weapons);
  items.push(...equipment.potions);
  items.push(...equipment.tools);
  return items;
}

export function getHeroBaseEquipment(hero: HeroCategory): string[] {
  const heroCategoryAsNumber = hero as number;
  const heroData = heroesData.find((h) => h.id === heroCategoryAsNumber);
  if (!heroData) {
    return [];
  }
  return heroData.equipments;
}
