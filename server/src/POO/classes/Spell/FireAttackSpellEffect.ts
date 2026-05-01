import { dealDamage } from "../../../services/CombatService";
import { DiceServiceRegistry } from "../../../services/DiceServiceRegistry";
import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { MonsterCategory } from "../../enums/Categories/MonsterCategory";
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

  async applyEffect(target: Unit<HeroCategory | MonsterCategory>): Promise<void> {
    const dice = DiceServiceRegistry.get();
    const result = await dice.rollRedDice(
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
