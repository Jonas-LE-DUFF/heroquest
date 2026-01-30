import { SpellElement } from "../../enums/SpellElement";
import { Unit } from "../Units/Unit";
import { SpellEffect } from "./SpellEffect";

class Spell {
    toJson(): any {
        return {
            id: this.id,
            name: this.name,
            element: this.element,
        }
    }
    id: string;
    name: string;
    element: SpellElement;
    effect: SpellEffect;
    target_type: string[];

    constructor(
        id: string,
        name: string,
        element: SpellElement,
        effect: SpellEffect,
        target_type: string[],
    ) {
        this.id = id;
        this.name = name;
        this.element = element;
        this.effect = effect;
        this.target_type = target_type;
    }

    applyEffect(target: Unit<any>) {
        this.effect.applyEffect(target);
    }
}

export { Spell };
