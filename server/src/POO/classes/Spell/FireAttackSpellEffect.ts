import { rollFightDice, rollRedDice } from "../../../services/DiceService";
import { Unit } from "../Units/Unit";
import { SpellEffect } from "./SpellEffect";

class FireAttackSpellEffect extends SpellEffect {
    damageAmount: number;

    constructor(damageAmount: number) {
        super("damage");
        this.damageAmount = damageAmount;
    }

    applyEffect(target: Unit<any>): void {
        const diceRoll = rollFightDice();
        const redDiceRoll = rollRedDice();
        const totalDamage = this.damageAmount + diceRoll + redDiceRoll;

        if (target.stats.health !== undefined) {
            target.stats.health = Math.max(target.stats.health - totalDamage, 0);
        }
    }
}

export { FireAttackSpellEffect };