import heroesStats from "./game_cards/heroes.json";
import { heroClass, Unit } from "./type";

export function getHeroStats(heroType: heroClass) : Unit{
  const heroData = heroesStats.find(
    (hero) => hero.id === heroType
  );
    if (!heroData) {
        throw new Error(`Hero data not found for heroType: ${heroType}`);
    }
    return {
        hp: heroData.health,
        maxHp: heroData.health,
        spiritPoints: heroData.spiritPoints,
        nbAttackDice: heroData.nbAttackDice,
        nbDefenseDice: heroData.nbDefenseDice,
        name: heroData.name,
        movements: heroData.movements,
        spells: [],
        usedSpells: [],
        gold: 0,
        equipments: heroData.equipments,
        statusEffects: [],
    };
}