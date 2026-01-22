import { Armor } from "./Armor.ts";
import { Potion } from "./Potions/Potions.ts";
import { Weapon } from "./Weapon.ts";

class Equipment {
    gold: number;
    weapons: Weapon[] = [];
    selectedWeaponIndex: number = 0;
    
    armors: Armor[] = [];
    potions: Potion[] = [];

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
        return this.armors.reduce((total, armor) => total + armor.armorMovementDebuff, 0);
    }

    addWeapon(weapon: Weapon) {
        
        this.weapons.push(weapon);
    }

    addArmor(armor: Armor) {
        if( armor.type === "chestPiece" && this.armors.find(a => a.type === "chestPiece")) {
            throw new Error("Only one chest piece can be equipped at a time.");
        }
        this.armors.push(armor);
    }

    addPotion(potion: Potion) {
        this.potions.push(potion);
    }
}

export { Equipment };