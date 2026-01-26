import { Effect } from "../Effects/Effects";
import { Unit } from "../Units/Unit";
import { SpellEffect } from "./SpellEffect";

class ApplyEffectSpellEffect extends SpellEffect {
    effect : Effect;

    constructor(effect: Effect) {
        super(effect.isBuff ? "buff" : "debuff");
        this.effect = effect;
    }

    applyEffect(target: Unit<any>): void {
        target.addEffect(this.effect);
    }
}

export { ApplyEffectSpellEffect };