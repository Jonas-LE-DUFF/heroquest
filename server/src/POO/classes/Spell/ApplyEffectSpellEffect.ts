import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { MonsterCategory } from "../../enums/Categories/MonsterCategory";
import { Effect } from "../Effects/Effects";
import { Unit } from "../Units/Unit";
import { SpellEffect } from "./SpellEffect";

class ApplyEffectSpellEffect extends SpellEffect {
  effect: Effect;

  constructor(effect: Effect) {
    super(effect.isBuff ? "buff" : "debuff");
    this.effect = effect;
  }

  applyEffect(target: Unit<HeroCategory | MonsterCategory>): void {
    target.addEffect(this.effect);
    return;
  }
}

export { ApplyEffectSpellEffect };
