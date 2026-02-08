import { HeroCategory } from "../../../enums/Categories/HeroCategory";
import { SpellElement } from "../../../enums/SpellElement";
import { EquipmentAsJson } from "../Equipment/EquipmentAsJson";
import { SpellAsJson } from "../SpellAsJson";
import { StatsAsJson } from "./StatsAsJson";

interface HeroAsJson {
  id: string;
  controlledByPlayerId: string;
  name: string;
  category: HeroCategory;
  stats: StatsAsJson;
  equipment: EquipmentAsJson;
  spells: SpellAsJson[];
  usedSpells: SpellAsJson[];
  spellElements: SpellElement[];
}

export type { HeroAsJson };
