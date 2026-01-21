import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { FightDiceFaces } from "../../enums/Dices/FightDiceFaces";
import { Position } from "../Position/Position";
import { Stats } from "./Stats";
import { Unit } from "./Unit";

class Hero extends Unit<HeroCategory> {
    DefenseDiceType = FightDiceFaces.WhiteShield;
    

    equipment: Equipment;
    selectedWeapon: Weapon;

    constructor(id: string, name: string, category: HeroCategory, position: Position, stats: Stats, equipment: Equipment) {
        super(id, name, category, position, stats);
        this.equipment = equipment;
        this.selectedWeapon = equipment.weapons[0]; // default to first weapon
    }
    
    getDefenseDiceCount(): number {
        // Implementation specific to Hero
        return this.stats.nbDefenseDice;
    }

    getAttackDiceCount(): number {
        if (!this.selectedWeapon) {
            throw new Error("No weapon selected");
        }
        // Implementation specific to Hero
        return this.selectedWeapon.damage;
    }

}

export { Hero };