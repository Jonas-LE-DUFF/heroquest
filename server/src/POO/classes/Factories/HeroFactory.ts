import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { Hero } from "../Units/Hero";
import { Stats } from "../Units/Stats";

import heroStats from "../../../shared/game_cards/heroes.json";
import { Equipment } from "../Equipment/Equipment";
import { randomUUID } from "crypto";
import { HeroCreationWish } from "../FromClient/HeroCreationWish";
import { getSpellsForElements } from "../../../services/SpellService";

class HeroFactory {
  createHero(gameId: string, heroCreationWish: HeroCreationWish): Hero | null {
    const id: string = randomUUID();

    const heroCategory: HeroCategory = heroCreationWish.heroCategory;

    const stats: Stats = getHeroBaseStats(heroCategory);

    const equipment: Equipment = getHeroStartingEquipment(heroCategory);
    
    for (const equipmentId of heroCreationWish.equipments) {
      equipment.addEquipmentById(equipmentId);
    }

    const spells = getSpellsForElements(gameId, heroCreationWish.spellElements);

    const hero = new Hero(
      id,
      heroCreationWish.name,
      heroCategory,
      stats,
      equipment,
    );
    hero.spells = spells;
    return hero;
  }
}

function getHeroBaseStats(heroType: HeroCategory): Stats {
  const heroData = heroStats.find((hero) => hero.id === heroType);
  if (!heroData) {
    throw new Error(`Hero data not found for heroType: ${heroType}`);
  }
  return {
    health: heroData.health,
    maxHealth: heroData.health,
    spirit: heroData.spiritPoints,
    nbDefenseDice: heroData.nbDefenseDice,
    movements: heroData.movements,
  };
}

function getHeroStartingEquipment(heroType: HeroCategory): Equipment {
  const heroData = heroStats.find((hero) => hero.id === heroType);
  if (!heroData) {
    throw new Error(`Hero data not found for heroType: ${heroType}`);
  }
  const equipment = new Equipment(0);
  heroData.equipments.forEach((item) => {
    equipment.addEquipmentById(item);
  });
  return equipment;
}

export { HeroFactory };
