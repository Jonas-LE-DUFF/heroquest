import { GameState } from "../../POO/classes/GameState";
import { Unit } from "../../POO/classes/Units/Unit";
import { HeroCategory } from "../../POO/enums/Categories/HeroCategory";
import { MonsterCategory } from "../../POO/enums/Categories/MonsterCategory";
import { GameService } from "../../services/GameService";

export function checkUnitDefeat(
  gameId: string,
  target: Unit<MonsterCategory|HeroCategory>
) {
  console.log("Checking defeat for monster:", target);
  if (target.stats?.health === undefined || target.stats.health > 0) {
    console.log(target.stats?.health, "HP remaining. Target not defeated.");
  }
  console.log(`Monster ${target.id} defeated.`);
  const gameState: GameState | undefined = GameService.getGame(gameId)?.gameState;
  if (!gameState) {
    console.error("GameState not found for gameId:", gameId);
    return;
  }
  gameState.removeUnit(target);
}
