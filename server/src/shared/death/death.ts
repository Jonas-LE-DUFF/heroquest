import { GameState } from "../../POO/classes/GameState";
import { Unit } from "../../POO/classes/Units/Unit";
import { HeroCategory } from "../../POO/enums/Categories/HeroCategory";
import { MonsterCategory } from "../../POO/enums/Categories/MonsterCategory";

export function checkUnitDefeat(
  gameState: GameState,
  target: Unit<MonsterCategory|HeroCategory>
) {
  console.log("Checking defeat for monster:", target);
  if (target.stats?.health === undefined || target.stats.health > 0) {
    console.log(target.stats?.health, "HP remaining. Target not defeated.");
    return gameState;
  }
  console.log(`Monster ${target.id} defeated.`);
  gameState.removeUnit(target);

  return gameState;
}
