import { SpellElement } from "../../enums/SpellElement.ts";
import { SpellEffect } from "./SpellEffect";

class Spell {
    id: string;
    name: string;
    type: "damage" | "healing" | "buff" | "debuff";
    element: SpellElement;
    effect: SpellEffect;

    constructor(id: string, name: string, type: "damage" | "healing" | "buff" | "debuff", element: SpellElement, effect: SpellEffect) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.element = element;
        this.effect = effect;
    }

    applyEffect() {
        this.effect.applyEffect();
    }
}

export { Spell };