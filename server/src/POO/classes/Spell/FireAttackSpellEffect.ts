import { dealDamage } from "../../../services/CombatService";
import { DiceServiceRegistry } from "../../../services/DiceServiceRegistry";
import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { MonsterCategory } from "../../enums/Categories/MonsterCategory";
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

  applyEffect(target: Unit<HeroCategory | MonsterCategory>): void {
    const dice = DiceServiceRegistry.get();
    const result = dice.rollRedDice({
      gameId: this.gameId,
      wishedNumberOfDices: 1,
      playerId: target.controlledByPlayerId,
    });
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
