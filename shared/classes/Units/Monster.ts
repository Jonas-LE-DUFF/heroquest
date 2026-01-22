import { MonsterCategory } from "../../enums/Categories/MonsterCategory";
import { FightDiceFaces } from "../../enums/Dices/FightDiceFaces";
import { StatType } from "../../enums/StatType";
import { EffectService } from "../Effects/EffectService";
import { Position } from "../Position/Position";
import { Stats } from "./Stats";
import { Unit } from "./Unit";

class Monster extends Unit<MonsterCategory> {
    DefenseDiceType = FightDiceFaces.BlackShield;

    nbAttackDice: number;

    constructor(id: string, name: string, category: MonsterCategory, position: Position, stats: Stats, nbAttackDice: number) {
        super(id, name, category, position, stats);
        this.nbAttackDice = nbAttackDice;
    }

    getDefenseDiceCount(): number {
        const baseDefense = this.stats.nbDefenseDice;
        
        const modifier = EffectService.getStatModifier(this, StatType.DEFENSE);
        const multiplier = EffectService.getStatMultiplier(this, StatType.DEFENSE);
        
        return Math.floor((baseDefense + modifier) * multiplier);
    }

    getAttackDiceCount(): number {
        const baseAttack = this.nbAttackDice;
        
        const modifier = EffectService.getStatModifier(this, StatType.ATTACK);
        const multiplier = EffectService.getStatMultiplier(this, StatType.ATTACK);
        
        return Math.floor((baseAttack + modifier) * multiplier);
    }

    getMovementPoints(): number {
        const baseMovement = this.stats.movements;
        
        const modifier = EffectService.getStatModifier(this, StatType.MOVEMENT);
        const multiplier = EffectService.getStatMultiplier(this, StatType.MOVEMENT);
        
        return Math.floor((baseMovement + modifier) * multiplier);
    }
}

export { Monster };