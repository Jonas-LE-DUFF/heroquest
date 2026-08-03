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
    dice.rollDice({
      gameId: this.gameId,
      wishedNumberOfDices: this.damageAmount,
      playerId: target.controlledByPlayerId,
      kind: "red",
      callback: (result) => {
        const redDiceRoll = result.filter((value) => {
          const val = value;
          return val === 5 || val === 6;
        });
        const totalDamage = this.damageAmount - redDiceRoll.length;
        dealDamage(this.gameId, target, totalDamage);
      },
    });
  }
}

export { FireAttackSpellEffect };
