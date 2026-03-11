import { GameState } from "../../POO/classes/GameState";
import { Unit } from "../../POO/classes/Units/Unit";
import { HeroCategory } from "../../POO/enums/Categories/HeroCategory";
import { MonsterCategory } from "../../POO/enums/Categories/MonsterCategory";
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
  console.log(`Target ${target.id} defeated.`);
  const gameState: GameState | undefined =
    GameService.getGame(gameId)?.gameState;
  if (!gameState) {
    console.error("GameState not found for gameId:", gameId);
    return false;
  }
  gameState.removeUnit(target);
  return true;
}
