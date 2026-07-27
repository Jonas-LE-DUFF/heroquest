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
    const result = dice.rollDice({
      gameId: this.gameId,
      wishedNumberOfDices: this.damageAmount,
      playerId: target.controlledByPlayerId,
      kind: "red",
    });
    const redDiceRoll = result.results?.filter((value) => {
      const val = value as number;
      return val === 5 || val === 6;
    });
    if (!redDiceRoll) {
      throw new Error("Error rolling red dice for Fire Attack Spell Effect.");
    }
    const totalDamage = this.damageAmount - redDiceRoll.length;
    dealDamage(this.gameId, target, totalDamage);
  }
}

export { FireAttackSpellEffect };
