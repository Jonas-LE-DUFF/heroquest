import { Unit } from "../Units/Unit";
import { SpellEffect } from "./SpellEffect";

class SpecialSpellEffect extends SpellEffect {

    constructor() {
        super("special");
    }

    applyEffect(target: Unit<any>): void {
        // Special effects need custom implementation
    }
}

export { SpecialSpellEffect };