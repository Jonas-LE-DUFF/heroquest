import { Game } from "../../POO/classes/Server/Game";
import { Hero } from "../../POO/classes/Units/Hero";
import { Unit } from "../../POO/classes/Units/Unit";
import { HeroCategory } from "../../POO/enums/Categories/HeroCategory";
import { MonsterCategory } from "../../POO/enums/Categories/MonsterCategory";
import { PlayerRole } from "../../POO/enums/PlayerRole";
import { GameService } from "../../services/GameService";

/**
 * This function checks if a target is defeated and removes it from the game if health points reached 0 or less
 *
 * @param gameId : the id of the current game
 * @param target : the unit we want to check if its defeated
 * @returns : true if the unit has been removed from the game false otherwise
 */
export function checkUnitDefeat(
  gameId: string,
  target: Unit<MonsterCategory | HeroCategory>,
): boolean {
  if (target.stats?.health === undefined || target.stats.health > 0) {
    console.log(target.stats?.health, "HP remaining. Target not defeated.");
    return false;
  }
  const game: Game | null = GameService.getGame(gameId);
  if (!game) {
    console.error("game not found for gameId:", gameId);
    return false;
  }
  if (target.getRole() === PlayerRole.HERO) {
    // need to check if the hero has a healing spell or a healing potion in their inventory before removing them from the game
    console.log("Hero defeated. Checking for healing options...");
    const hero = target as Hero;
    const healingSpell = hero.spells.find(
      (spell) =>
        spell.effect.type === "healing" && !hero.usedSpells.includes(spell),
    );
    if (healingSpell) {
      console.log("Hero has a healing spell. using it to heal the hero.");
      target.stats.health = 1;
      hero.usedSpells.push(healingSpell);
      return false;
    }

    const healingPotion = hero.equipment.potions.find(
      (potion) => potion.reference === "heal_potion",
    );
    if (healingPotion) {
      console.log("Hero has a healing potion. using it to heal the hero.");
      target.stats.health = 1;
      hero.equipment.removePotion(healingPotion.id);
      return false;
    }
  }
  game.killUnit(target);
  return true;
}
