import { dealDamage } from "../../../services/CombatService";
import { rollFightDice, rollRedDice } from "../../../services/DiceService";
import { PlayerRole } from "../../enums/PlayerRole";
import { Unit } from "../Units/Unit";
import { SpellEffect } from "./SpellEffect";

class FireAttackSpellEffect extends SpellEffect {
    gameId: string;
    damageAmount: number;

    constructor(gameId: string, damageAmount: number) {
        super("damage");
        this.gameId = gameId;
        this.damageAmount = damageAmount;
    }

    applyEffect(target: Unit<any>): void {
        rollRedDice(
            this.gameId,
            this.damageAmount,
            PlayerRole.GAME_MASTER,
        ).then((result) => {
            const redDiceRoll = result.results.filter((value) => {
                return value === 5 || value === 6;
            });
            const totalDamage = this.damageAmount - redDiceRoll.length;
            dealDamage(this.gameId, target, totalDamage);
        });
    }
}

export { FireAttackSpellEffect };
