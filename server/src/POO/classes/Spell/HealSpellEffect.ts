import { Unit } from "../Units/Unit";
import { SpellEffect } from "./SpellEffect";

class HealSpellEffect extends SpellEffect {
    healAmount: number;
    
    constructor(healAmount: number) {
        super("healing");
        this.healAmount = healAmount;
    }

    applyEffect(target: Unit<any>): void {
        if (target.stats.health !== undefined && target.stats.maxHealth !== undefined) {
            target.stats.health = Math.min(
                target.stats.health + this.healAmount,
                target.stats.maxHealth
            );
        }
    }
}

export { HealSpellEffect };