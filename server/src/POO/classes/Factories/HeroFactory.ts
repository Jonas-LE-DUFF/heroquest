import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { Hero } from "../Units/Hero";
import { Stats } from "../Units/Stats";

import heroStats from "../../../shared/game_cards/heroes.json";
import { Equipment } from "../Equipment/Equipment";
import { randomUUID } from "crypto";
import { HeroCreationWish } from "../FromClient/HeroCreationWish";
import { getSpellsForElements } from "../../../services/SpellService";
import { GameService } from "../../../services/GameService";

class HeroFactory {
  createHero(gameId: string, heroCreationWish: HeroCreationWish): Hero | null {
    const game = GameService.getGame(gameId);
    const spells = getSpellsForElements(gameId, heroCreationWish.spellElements);
    const spellsTaken = game?.gameState.getSpellsTaken(spells) || [];
    if (spellsTaken.length > 0) {
      throw new Error(
        `The spells ${spellsTaken.map((spell) => spell.name).join(", ")} are already selected by another player.`,
      );
    }
    if (game?.gameState.isHeroCategoryTaken(heroCreationWish.heroCategory)) {
      throw new Error(
        `Hero of category ${heroCreationWish.heroCategory} already exists in the game.`,
      );
    }

    const id: string = randomUUID();

    const heroCategory: HeroCategory = heroCreationWish.heroCategory;

    const stats: Stats = getHeroBaseStats(heroCategory);

    const equipment: Equipment = getHeroStartingEquipment(heroCategory);

    for (const equipmentId of heroCreationWish.equipments) {
      if (!equipment.hasEquipment(equipmentId)) {
        equipment.addEquipmentById(equipmentId);
      }
    }

    if (heroCategory === HeroCategory.Cleric) {
      equipment.removeClericUncarryableEquipment();
    }

    const hero = new Hero(
      id,
      heroCreationWish.name,
      heroCategory,
      stats,
      equipment,
    );
    hero.spells = spells;

    const validateStatsResult = hero.validateStats();
    if (!validateStatsResult.success) {
      throw new Error(`${validateStatsResult.error}`);
    }

    return hero;
  }
}

function getHeroBaseStats(heroType: HeroCategory): Stats {
  const heroData = heroStats.find((hero) => hero.id === (heroType as number));
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
  const heroData = heroStats.find((hero) => hero.id === (heroType as number));
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
