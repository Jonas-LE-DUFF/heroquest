import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { FightDiceFaces } from "../../enums/Dices/FightDiceFaces";
import { StatType } from "../../enums/StatType";
import { EffectService } from "../Effects/EffectService";
import { Equipment } from "../Equipment/Equipment";
import { Position } from "../Position/Position";
import { Stats } from "./Stats";
import { Unit } from "./Unit";

class Hero extends Unit<HeroCategory> {
    DefenseDiceType = FightDiceFaces.WhiteShield;
    
    equipment: Equipment;

    constructor(id: string, name: string, category: HeroCategory, position: Position, stats: Stats, equipment: Equipment) {
        super(id, name, category, position, stats);
        this.equipment = equipment;
    }
    
    getDefenseDiceCount(): number {
        const armorDefense = this.equipment.getDefenseTotalValue();
        const baseDefense = armorDefense + this.stats.nbDefenseDice;
        
        const modifier = EffectService.getStatModifier(this, StatType.DEFENSE);
        const multiplier = EffectService.getStatMultiplier(this, StatType.DEFENSE);
        
        return Math.floor((baseDefense + modifier) * multiplier);
    }

    getAttackDiceCount(): number {
        const weaponAttack = this.equipment.getDamageOfSelectedWeapon();
        
        const modifier = EffectService.getStatModifier(this, StatType.ATTACK);
        const multiplier = EffectService.getStatMultiplier(this, StatType.ATTACK);
        
        return Math.floor((weaponAttack + modifier) * multiplier);
    }

    getMovementPoints(): number {
        const debuff = this.equipment.getMovementDebuff();
        const baseMovement = this.stats.movements - debuff;
        
        const modifier = EffectService.getStatModifier(this, StatType.MOVEMENT);
        const multiplier = EffectService.getStatMultiplier(this, StatType.MOVEMENT);
        
        return Math.floor((baseMovement + modifier) * multiplier);
    }

}

export { Hero };