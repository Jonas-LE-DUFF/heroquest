import { dealDamage } from "../../../services/CombatService";
import { rollRedDice } from "../../../services/DiceService";
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

  async applyEffect(target: Unit<any>): Promise<void> {
    const result = await rollRedDice(
      this.gameId,
      this.damageAmount,
      PlayerRole.GAME_MASTER,
    );
    const redDiceRoll = result.results?.filter((value) => {
      return value === 5 || value === 6;
    });
    if (!redDiceRoll) {
      throw new Error("Error rolling red dice for Fire Attack Spell Effect.");
    }
    const totalDamage = this.damageAmount - redDiceRoll.length;
    dealDamage(this.gameId, target, totalDamage);
  }
}

export { FireAttackSpellEffect };
