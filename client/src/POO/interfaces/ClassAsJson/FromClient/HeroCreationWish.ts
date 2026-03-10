import { HeroCategory } from "../../../enums/Categories/HeroCategory";
import { SpellElement } from "../../../enums/SpellElement";

interface HeroCreationWish {
  gameId: string;
  name: string;
  heroCategory: HeroCategory;
  gold: number;
  spellElements: SpellElement[];
  equipments: string[];
  modifiedHeroId: string | undefined;
}

export type { HeroCreationWish };
