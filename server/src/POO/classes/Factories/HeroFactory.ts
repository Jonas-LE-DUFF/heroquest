import * as uuid from "uuid";

import { HeroCategory } from "../../enums/Categories/HeroCategory";
import { Position } from "../Position/Position";
import { Hero } from "../Units/Hero";
import { Stats } from "../Units/Stats";

import heroStats from "../../game_cards/heroes.json";
import { Equipment } from "../Equipment/Equipment";

class HeroFactory {
    createHero(heroCategory: HeroCategory, position: Position, name: string): Hero | null{

        const id:string = uuid.v4();

        const stats: Stats = getHeroBaseStats(heroCategory);

        const equipment: Equipment = getHeroStartingEquipment(heroCategory);

        const startingPosition: Position = position;

        return new Hero(
            id,
            name,
            heroCategory,
            startingPosition,
            stats,
            equipment
        );
    };
}

function getHeroBaseStats(heroType: HeroCategory) : Stats{
  const heroData = heroStats.find(
    (hero) => hero.id === heroType
  );
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

function getHeroStartingEquipment(heroType: HeroCategory) : Equipment{
    const heroData = heroStats.find(
      (hero) => hero.id === heroType
    );
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