import equipmentsData from "./game_cards/equipments.json";

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

/**
 * Get the French name of an equipment by its id
 */
export function getEquipmentName(id: string): string {
    const equipment = getEquipmentById(id);
    return equipment?.name ?? id;
}

/**
 * Get the stats/modifiers of an equipment by its id
 */
export function getEquipmentModifiers(id: string): EquipmentModifiers {
    const equipment = getEquipmentById(id);
    return equipment?.modifiers ?? {};
}

/**
 * Get the range type of an equipment
 */
export function getEquipmentRange(id: string): string {
    const equipment = getEquipmentById(id);
    return equipment?.range ?? "none";
}

/**
 * Get the number of attack dice provided by an equipment
 */
export function getEquipmentAttackDice(id: string): number {
    const modifiers = getEquipmentModifiers(id);
    return modifiers.nbAttackDice ?? 0;
}

/**
 * Get the number of defense dice provided by an equipment
 */
export function getEquipmentDefenseDice(id: string): number {
    const modifiers = getEquipmentModifiers(id);
    return modifiers.nbDefenseDice ?? 0;
}

/**
 * Get the movement modifier of an equipment (can be negative)
 */
export function getEquipmentMovementModifier(id: string): number {
    const modifiers = getEquipmentModifiers(id);
    return modifiers.movements ?? 0;
}

/**
 * Get the cost of an equipment
 */
export function getEquipmentCost(id: string): number {
    const equipment = getEquipmentById(id);
    return equipment?.cost ?? 0;
}

/**
 * Check if an equipment is bearable by a cleric
 */
export function isClericBearable(id: string): boolean {
    const equipment = getEquipmentById(id);
    return equipment?.cleric_bearable ?? false;
}

/**
 * Check if an equipment is a consumable (single use)
 */
export function isConsumable(id: string): boolean {
    const equipment = getEquipmentById(id);
    return equipment?.unique_usage ?? false;
}

/**
 * Get the type of an equipment (Weapon, Armor, Consumable)
 */
export function getEquipmentType(id: string): string {
    const equipment = getEquipmentById(id);
    return equipment?.type ?? "unknown";
}

/**
 * Get the list of equipment ids that prevent the use of this equipment
 */
export function getEquipmentsPreventingUse(id: string): string[] {
    const equipment = getEquipmentById(id);
    return equipment?.equipments_preventing_use ?? [];
}

/**
 * Check if two equipments can be used together
 */
export function canEquipmentsBeCombined(id1: string, id2: string): boolean {
    const preventing1 = getEquipmentsPreventingUse(id1);
    const preventing2 = getEquipmentsPreventingUse(id2);
    return !preventing1.includes(id2) && !preventing2.includes(id1);
}

/**
 * Get all available equipments
 */
export function getAllEquipments(): Equipment[] {
    return [...equipments];
}

/**
 * Get all equipments of a specific type
 */
export function getEquipmentsByType(type: "Weapon" | "Armor" | "Consumable"): Equipment[] {
    return equipments.filter((eq) => eq.type === type);
}