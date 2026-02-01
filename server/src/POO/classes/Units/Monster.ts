import { MonsterCategory } from "../../enums/Categories/MonsterCategory";
import { FightDiceFaces } from "../../enums/Dices/FightDiceFaces";
import { StatType } from "../../enums/Effects/StatType";
import { EffectService } from "../../../services/EffectService";
import { Stats } from "./Stats";
import { Unit } from "./Unit";
import { PlayerRole } from "../../enums/PlayerRole";
import { MonsterAsJson } from "../../interfaces/ClassAsJson/Unit/MonsterAsJson";

class Monster extends Unit<MonsterCategory> {
    DefenseDiceType = FightDiceFaces.BlackShield;

    nbAttackDice: number;

    constructor(controlledById: string, name: string, category: MonsterCategory, stats: Stats, nbAttackDice: number) {
        super(controlledById, name, category, stats);
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

    validateStatsImplementation(): {success: boolean; error?: string} {
        // Ensure all stats are non-negative integers
        for (const value of Object.values(this.stats)) {
            if (value < 0) {
                return { success: false, error: "Stats cannot be negative" };
            }
        }
        if (this.stats.health > this.stats.maxHealth) {
            return { success: false, error: "Health cannot exceed max health" };
        }
        return { success: true };
    }

    getRole(): PlayerRole {
        return PlayerRole.GAME_MASTER;
    }

    toJson(): MonsterAsJson {
        return {
            id: this.id,
            name: this.name,
            category: this.category,
            stats: {
                movements: this.stats.movements,
                health: this.stats.health,
                maxHealth: this.stats.maxHealth,
                attack: this.nbAttackDice,
                defense: this.stats.nbDefenseDice,
                spirit: this.stats.spirit,
            },
        };
    }
}

export { Monster };