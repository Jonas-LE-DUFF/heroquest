// this needs to be a strategy pattern base class for different spell effects

import { Unit } from "../Units/Unit";

abstract class SpellEffect {
    type: "damage" | "healing" | "buff" | "debuff";
    
    constructor(type: "damage" | "healing" | "buff" | "debuff") {
        this.type = type;
    }

    abstract applyEffect(target: Unit<any>): void;
}

export { SpellEffect };