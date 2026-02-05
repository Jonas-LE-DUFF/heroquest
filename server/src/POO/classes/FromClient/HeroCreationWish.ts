import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { SpellElement } from "../../enums/SpellElement";

interface HeroCreationWish {
    name: string;
    heroCategory: HeroCategory;
    gold: number;
    spellElements: SpellElement[];
    equipments: string[];
}

export type { HeroCreationWish };