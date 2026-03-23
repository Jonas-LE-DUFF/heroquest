import { Unit } from "../Units/Unit";
import { SpellEffect } from "./SpellEffect";

// used for djinn spell that has no direct effect but allows to choose among two different spells
class SpecialSpellEffect extends SpellEffect {

    constructor() {
        super("special");
    }

    async applyEffect(target: Unit<any>): Promise<void> {
        // Special effects need custom implementation
    }
}

export { SpecialSpellEffect };