import { SpellElement } from "../../../enums/SpellElement";

interface HeroCreationWish {
    name: string;
    gold: number;
    spellElements: SpellElement[];
    equipments: string[];
}

export type { HeroCreationWish };