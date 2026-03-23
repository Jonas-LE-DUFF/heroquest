import { Effect } from "../Effects/Effects";
import { Unit } from "../Units/Unit";
import { SpellEffect } from "./SpellEffect";

class ApplyEffectSpellEffect extends SpellEffect {
    effect : Effect;

    constructor(effect: Effect) {
        super(effect.isBuff ? "buff" : "debuff");
        this.effect = effect;
    }

    async applyEffect(target: Unit<any>): Promise<void> {
        target.addEffect(this.effect);
    }
}

export { ApplyEffectSpellEffect };